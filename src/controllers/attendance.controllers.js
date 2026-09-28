import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Attendance } from "../models/attendance.models.js";
import { Project } from "../models/project.models.js";

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
