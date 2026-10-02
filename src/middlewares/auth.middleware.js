import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Batch } from "../models/batch.models.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { SystemRolesEnum } from "../utils/constants.js";

const isLoggedIn = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json(new ApiError(403, "Invalid or expired token"));
  }
};

const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      return res
        .status(403)
        .json(new ApiError(403, "Invalid or expired token"));
    }

    const project = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!project) {
      return res.status(403).json(new ApiError(403, "Project not found"));
    }

    const givenRole = project?.role;

    if (!roles.includes(givenRole)) {
      return res
        .status(403)
        .json(
          new ApiError(
            403,
            "You do not have permission to perform this action",
          ),
        );
    }

    req.userRole = givenRole;
    next();
  });

const isSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== SystemRolesEnum.SUPERADMIN) {
    return res.status(403).json(new ApiError(403, "Access denied. Super Admin role required."));
  }
  next();
};

export const validateBatchAccess = (allowedRoles = ['hod', 'coordinator']) =>
  asyncHandler(async (req, res, next) => {
    const { batchId } = req.params;
    const userId = req.user._id;

    if (!batchId) {
      return res.status(400).json(new ApiError(400, "batchId is required"));
    }

    const batch = await Batch.findById(batchId).populate("workspaceId");
    if (!batch) return res.status(404).json(new ApiError(404, "Batch not found"));

    const isCoordinator = batch.coordinators?.some(
      (c) => (c._id ? c._id.toString() : c.toString()) === userId.toString()
    );
    const isHod = batch.workspaceId?.authorizedHods?.some(
      (hod) => (hod._id ? hod._id.toString() : hod.toString()) === userId.toString()
    );

    req.isBatchCoordinator = isCoordinator;
    req.isHod = isHod;

    if (allowedRoles.includes('hod') && isHod) return next();
    if (allowedRoles.includes('coordinator') && isCoordinator) return next();

    return res.status(403).json(new ApiError(403, "Access denied. Only HODs and Batch Coordinators can access this batch"));
  });

export { isLoggedIn, validateProjectPermission, isSuperAdmin };
