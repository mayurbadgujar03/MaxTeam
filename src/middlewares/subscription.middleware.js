import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { PlanTypeEnum, MAX_FREE_PROJECTS } from "../utils/constants.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";

const enforceFreeWall = asyncHandler(async (req, res, next) => {
  const { planType } = req.user;

  if (planType !== PlanTypeEnum.FREE) {
    return next();
  }

  // Bypass personal limit for institutional projects
  if (req.body.workspaceId) {
    return next();
  }

  const memberships = await ProjectMember.find({ user: req.user._id }).select(
    "project",
  );
  const projectIds = memberships.map((m) => m.project);

  const personalProjectCount = await Project.countDocuments({
    _id: { $in: projectIds },
    workspaceId: null,
  });

  if (personalProjectCount >= MAX_FREE_PROJECTS) {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "Free plan limit reached. You are already participating in a personal project. Please upgrade to create or join more.",
        ),
      );
  }

  next();
});

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
