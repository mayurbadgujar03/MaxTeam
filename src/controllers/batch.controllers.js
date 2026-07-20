import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Batch } from "../models/batch.models.js";

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

  if (!workspaceId) {
    return res.status(400).json(new ApiError(400, "workspaceId is required"));
  }

  const batches = await Batch.find({ workspaceId }).populate("coordinators", "fullname username email").lean();

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

export { createBatch, getWorkspaceBatches, getPublicBatchDetails };
