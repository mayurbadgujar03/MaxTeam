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

export { createBatch, getWorkspaceBatches };
