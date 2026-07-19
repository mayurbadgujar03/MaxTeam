import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { PlanTypeEnum, UserRolesEnum } from "../utils/constants.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";

/**
 * enforceFreeWall
 *
 * Blocks project creation when a FREE-tier user already owns or
 * administers >= 1 active project.
 *
 * Must run AFTER `isLoggedIn` so `req.user` is populated.
 */
const enforceFreeWall = asyncHandler(async (req, res, next) => {
  const { planType } = req.user;

  // Only enforce for FREE plan users
  if (planType !== PlanTypeEnum.FREE) {
    return next();
  }

  const userId = req.user._id;

  // Count projects where the user is the creator
  const ownedCount = await Project.countDocuments({ createdBy: userId });

  if (ownedCount >= 1) {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "Free plan limit reached. Please upgrade to create more projects.",
        ),
      );
  }

  // Also check if user is an ADMIN member on any project (co-ownership)
  const adminMemberships = await ProjectMember.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    role: UserRolesEnum.ADMIN,
  });

  if (adminMemberships >= 1) {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "Free plan limit reached. Please upgrade to create more projects.",
        ),
      );
  }

  next();
});

/**
 * enforceNotFrozen
 *
 * Blocks any mutation on a project that has been frozen due to
 * an expired subscription. Accepts `projectId` from `req.params`.
 *
 * Must run AFTER `isLoggedIn` so `req.user` is populated.
 */
const enforceNotFrozen = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  if (!projectId) {
    return next();
  }

  const project = await Project.findById(projectId).select("isFrozen").lean();

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  if (project.isFrozen === true) {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "This project is frozen due to an expired subscription. Read-only access enabled.",
        ),
      );
  }

  next();
});

export { enforceFreeWall, enforceNotFrozen };
