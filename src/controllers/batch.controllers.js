import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Batch } from "../models/batch.models.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { User } from "../models/user.models.js";

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

export { createBatch, getWorkspaceBatches, getPublicBatchDetails, updateBatchCoordinators };
