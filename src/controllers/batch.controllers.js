import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Batch } from "../models/batch.models.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";

const createBatch = asyncHandler(async (req, res) => {
  const { name, department, workspaceId, coordinators } = req.body;

  if (!name || !department || !workspaceId) {
    return res
      .status(400)
      .json(new ApiError(400, "name, department, and workspaceId are required"));
  }

  const batch = await Batch.create({
    name,
    department,
    workspaceId,
    coordinators: coordinators || [],
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, batch, "Batch created successfully"));
});

const getWorkspaceBatches = asyncHandler(async (req, res) => {
  const { workspaceId } = req.query;
  const userId = req.user._id;

  if (!workspaceId) {
    return res.status(400).json(new ApiError(400, "workspaceId is required"));
  }

  const workspace = await InstitutionWorkspace.findById(workspaceId).lean();
  if (!workspace) {
    return res.status(404).json(new ApiError(404, "Workspace not found"));
  }

  const isHod = workspace.authorizedHods?.some(
    (hodId) => hodId.toString() === userId.toString()
  ) || false;

  const query = { workspaceId };
  if (!isHod) {
    query.coordinators = userId;
  }

  const batches = await Batch.find(query)
    .populate("coordinators", "fullname username email")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, batches, "Batches fetched successfully"));
});

const getPublicBatchDetails = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) {
    return res
      .status(400)
      .json(new ApiError(400, "batchId is required"));
  }

  const batch = await Batch.findById(batchId)
    .populate("workspaceId", "name")
    .populate("coordinators", "_id fullname")
    .lean();

  if (!batch) {
    return res
      .status(404)
      .json(new ApiError(404, "Batch not found"));
  }

  const publicData = {
    _id: batch._id,
    name: batch.name,
    department: batch.department,
    workspaceName: batch.workspaceId?.name || "Unknown Institution",
    workspaceId: batch.workspaceId?._id || null,
    coordinators: (batch.coordinators || []).map((c) => ({
      _id: c._id,
      fullname: c.fullname,
    })),
  };

  return res
    .status(200)
    .json(new ApiResponse(200, publicData, "Batch details fetched successfully"));
});

const updateBatchCoordinators = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const { coordinatorEmails } = req.body;
  const userId = req.user._id;

  if (!batchId) {
    return res.status(400).json(new ApiError(400, "batchId is required"));
  }

  if (!Array.isArray(coordinatorEmails)) {
    return res.status(400).json(new ApiError(400, "coordinatorEmails must be an array of email strings"));
  }

  const batch = await Batch.findById(batchId);
  if (!batch) {
    return res.status(404).json(new ApiError(404, "Batch not found"));
  }

  const workspace = await InstitutionWorkspace.findById(batch.workspaceId).lean();
  if (!workspace) {
    return res.status(404).json(new ApiError(404, "Workspace not found"));
  }

  const isHod = workspace.authorizedHods?.some(
    (hodId) => hodId.toString() === userId.toString()
  ) || false;

  if (!isHod) {
    return res.status(403).json(new ApiError(403, "Only HODs can assign coordinators to batches"));
  }

  const normalizedEmails = coordinatorEmails.map(email => email.toLowerCase().trim());
  const coordinatorsList = await User.find({ email: { $in: normalizedEmails } }).select("_id").lean();
  const resolvedUserIds = coordinatorsList.map(u => u._id);

  const updatedBatch = await Batch.findByIdAndUpdate(
    batchId,
    { coordinators: resolvedUserIds },
    { new: true }
  ).populate("coordinators", "fullname username email");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBatch, "Coordinators updated successfully"));
});

const getBatchById = asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  const userId = req.user._id;

  if (!batchId) {
    return res.status(400).json(new ApiError(400, "batchId is required"));
  }

  const batch = await Batch.findById(batchId)
    .populate("coordinators", "fullname username email")
    .lean();

  if (!batch) {
    return res.status(404).json(new ApiError(404, "Batch not found"));
  }

  const workspace = await InstitutionWorkspace.findById(batch.workspaceId).lean();
  if (!workspace) {
    return res.status(404).json(new ApiError(404, "Workspace not found"));
  }

  const isHod = workspace.authorizedHods?.some(
    (hodId) => hodId.toString() === userId.toString()
  ) || false;

  const isCoordinator = batch.coordinators?.some(
    (c) => c._id.toString() === userId.toString()
  ) || false;

  if (!isHod && !isCoordinator) {
    return res.status(403).json(new ApiError(403, "You do not have access to this batch"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, batch, "Batch fetched successfully"));
});

const getBatchStats = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) {
    return res.status(400).json(new ApiError(400, "batchId is required"));
  }

  const projects = await Project.find({ batchId, deletedAt: null }).lean();
  const projectIds = projects.map((p) => p._id);

  const totalProjects = projects.length;

  const totalMembers = await ProjectMember.countDocuments({
    project: { $in: projectIds },
    deletedAt: null,
  });

  const frozenProjects = projects.filter((p) => p.isFrozen).length;
  const activeProjects = totalProjects - frozenProjects;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalProjects,
        totalMembers,
        frozenProjects,
        activeProjects,
      },
      "Batch stats fetched successfully"
    )
  );
});

const exportBatchCSV = asyncHandler(async (req, res) => {
  const { batchId } = req.params;

  if (!batchId) {
    return res.status(400).json(new ApiError(400, "batchId is required"));
  }

  const batch = await Batch.findById(batchId).lean();
  if (!batch) {
    return res.status(404).json(new ApiError(404, "Batch not found"));
  }

  const projects = await Project.find({ batchId, deletedAt: null })
    .populate("createdBy", "email fullname")
    .lean();
  const projectIds = projects.map((p) => p._id);

  const allMembers = await ProjectMember.find({
    project: { $in: projectIds },
    deletedAt: null,
  })
    .populate("user", "email fullname")
    .lean();

  const csvRows = [
    ["Project Name", "Description", "Mentor Email", "Leader Email", "Member Emails", "Created At"]
  ];

  for (const project of projects) {
    const pMembers = allMembers.filter(m => m.project.toString() === project._id.toString());
    
    const mentors = pMembers.filter(m => m.role === "admin" && m.user);
    const leaders = pMembers.filter(m => m.role === "project_admin" && m.user);
    const members = pMembers.filter(m => m.role === "member" && m.user);

    const mentorEmails = mentors.map(m => m.user.email).join("; ");
    const leaderEmails = leaders.map(m => m.user.email).join("; ");
    const memberEmails = members.map(m => m.user.email).join("; ");

    csvRows.push([
      project.name,
      project.description || "",
      mentorEmails || project.createdBy?.email || "",
      leaderEmails,
      memberEmails,
      project.createdAt ? project.createdAt.toISOString() : ""
    ]);
  }

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return "";
    const val = typeof str === "string" ? str : String(str);
    return `"${val.replace(/"/g, '""')}"`;
  };

  const csvContent = csvRows.map(row => row.map(escapeCSV).join(",")).join("\r\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=batch-report-${batch.name.replace(/[^a-zA-Z0-9]/g, "-")}.csv`);
  return res.status(200).send(csvContent);
});

export {
  createBatch,
  getWorkspaceBatches,
  getPublicBatchDetails,
  updateBatchCoordinators,
  getBatchById,
  getBatchStats,
  exportBatchCSV
};
