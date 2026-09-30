import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Attendance } from "../models/attendance.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";

export const markMentorAttendance = asyncHandler(async (req, res) => {
  const { projectId, milestoneId } = req.params;
  const { records } = req.body; // Array of { studentId, status: "PRESENT" | "ABSENT" | "PENDING" }

  if (!records || !Array.isArray(records)) {
    return res.status(400).json(new ApiError(400, "Records array is required"));
  }

  // 1. Get the project to extract the batchId
  const project = await Project.findById(projectId).select("batchId");
  if (!project) return res.status(404).json(new ApiError(404, "Project not found"));
  if (!project.batchId) return res.status(400).json(new ApiError(400, "Project is not assigned to a batch"));

  // 2. Prepare the highly efficient bulk write operations
  const bulkOps = records.map((record) => ({
    updateOne: {
      filter: {
        project: projectId,
        milestoneId: milestoneId,
        student: record.studentId,
      },
      update: {
        $set: {
          batch: project.batchId,
          mentorMark: record.status,
          mentorMarkedBy: req.user._id,
          mentorMarkedAt: new Date(),
        },
      },
      upsert: true, // Creates the document if it doesn't exist
    },
  }));

  // 3. Execute bulk write in a single database round-trip
  await Attendance.bulkWrite(bulkOps);

  return res.status(200).json(new ApiResponse(200, null, "Attendance saved successfully"));
});

export const getMilestoneAttendance = asyncHandler(async (req, res) => {
  const { projectId, milestoneId } = req.params;
  
  const attendance = await Attendance.find({ 
    project: projectId, 
    milestoneId 
  }).populate("student", "fullname username avatar");

  return res.status(200).json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
});

export const getBatchWeekAttendance = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const weekNumber = parseInt(req.query.week) || 1;

  // 1. Fetch all projects in the batch that include the requested week
  const projects = await Project.find({
    batchId,
    "milestones.weekNumber": weekNumber,
  })
    .select("name milestones groupNumber")
    .lean();

  // 2. Fetch and attach members from ProjectMember collection
  const projectIds = projects.map((p) => p._id);
  const allMembers = await ProjectMember.find({ project: { $in: projectIds } })
    .populate("user", "fullname username email avatar")
    .lean();

  const projectsWithMembers = projects.map((p) => ({
    ...p,
    members: allMembers.filter((m) => m.project.toString() === p._id.toString()),
  }));

  // 3. Extract the specific milestoneId for each project for the requested week
  const milestoneIds = projects
    .map((p) => {
      const ms = p.milestones?.find((m) => m.weekNumber === weekNumber);
      return ms ? ms._id : null;
    })
    .filter(Boolean);

  // 4. Fetch all attendance records for these milestones
  const attendances = await Attendance.find({
    batch: batchId,
    milestoneId: { $in: milestoneIds },
  }).lean();

  // We send back both the projects (for the grid rows) and the attendances (for the status)
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { projects: projectsWithMembers, attendances },
        "Batch attendance fetched"
      )
    );
});

export const markBatchAttendance = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { records, tier } = req.body; // tier: 'COORDINATOR' | 'HOD'

  if (!records || !Array.isArray(records)) {
    return res.status(400).json(new ApiError(400, "Records array is required"));
  }

  if (!["COORDINATOR", "HOD"].includes(tier)) {
    return res.status(400).json(new ApiError(400, "Invalid tier specified"));
  }

  // Ensure role permissions match tier
  if (tier === "HOD" && !req.isHod) {
    return res.status(403).json(new ApiError(403, "Only HODs can submit HOD-tier attendance"));
  }
  if (tier === "COORDINATOR" && !req.isBatchCoordinator && !req.isHod) {
    return res.status(403).json(new ApiError(403, "Only Coordinators or HODs can submit Coordinator-tier attendance"));
  }

  const bulkOps = records.map((record) => {
    const updateFields =
      tier === "COORDINATOR"
        ? {
            coordinatorMark: record.status,
            coordinatorMarkedBy: req.user._id,
            coordinatorMarkedAt: new Date(),
          }
        : {
            hodMark: record.status,
            hodMarkedBy: req.user._id,
            hodMarkedAt: new Date(),
          };

    return {
      updateOne: {
        filter: {
          batch: batchId,
          project: record.projectId,
          milestoneId: record.milestoneId,
          student: record.studentId,
        },
        update: { $set: updateFields },
        upsert: true, // If mentor missed it, Coordinator/HOD can still enforce it
      },
    };
  });

  if (bulkOps.length > 0) {
    await Attendance.bulkWrite(bulkOps);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, `${tier} attendance saved successfully`));
});
