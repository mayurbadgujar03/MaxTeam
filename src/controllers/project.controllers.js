import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  UserRolesEnum,
  PlanTypeEnum,
  MAX_FREE_PROJECTS,
} from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ProjectTask } from "../models/task.models.js";
import { ProjectSubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Notification } from "../models/notification.models.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { Batch } from "../models/batch.models.js";
import { clearProjectCommitCache } from "./codetrack.controllers.js";
import { generateDynamicTimeline } from "../utils/helpers.js";
import mongoose from "mongoose";

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { workspaceId, scope } = req.query;

  let isHod = false;
  let isCoordinator = false;
  let coordinatorBatchIds = [];

  if (workspaceId && workspaceId !== 'PERSONAL') {
    const workspace = await InstitutionWorkspace.findById(workspaceId).lean();
    if (workspace) {
      isHod = workspace.authorizedHods?.some(
        (hodId) => hodId.toString() === userId.toString()
      ) || false;
    }

    const coordinatorBatches = await Batch.find({
      workspaceId,
      coordinators: userId,
    })
      .select("_id")
      .lean();
    coordinatorBatchIds = coordinatorBatches.map((b) => b._id);
    isCoordinator = coordinatorBatchIds.length > 0;
  }

  // Security check: If requesting all workspace projects, caller MUST be HOD or Coordinator
  if (scope === 'all') {
    if (!isHod && !isCoordinator) {
      return res
        .status(403)
        .json(new ApiError(403, "Access denied. Only HODs and Batch Coordinators can view all workspace projects"));
    }
  }

  // Find direct project memberships for the user
  const memberShips = await ProjectMember.find({
    user: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  })
    .select("project")
    .lean();
  const memberProjectIds = memberShips.map((m) => m.project);

  let filter = { deletedAt: null };

  if (workspaceId && workspaceId !== 'PERSONAL') {
    filter.workspaceId = workspaceId;

    if (isHod) {
      // HOD in workspace
      if (scope === 'my') {
        filter._id = { $in: memberProjectIds };
      }
      // If scope === 'all' or default, HOD sees all workspace projects
    } else if (isCoordinator) {
      // Coordinator in workspace
      if (scope === 'my') {
        filter._id = { $in: memberProjectIds };
      } else {
        filter.$or = [
          { _id: { $in: memberProjectIds } },
          { batchId: { $in: coordinatorBatchIds } },
        ];
      }
    } else {
      // Regular Mentor / Student / Project Member: strictly direct memberships
      filter._id = { $in: memberProjectIds };
    }
  } else {
    // PERSONAL workspace
    filter.workspaceId = null;
    filter._id = { $in: memberProjectIds };
  }

  const projects = await Project.find(filter)
    .populate("batchId", "name department")
    .lean();

  // Fetch all members for these projects
  const projectIds = projects.map((p) => p._id);
  const allMembers = await ProjectMember.find({ project: { $in: projectIds } })
    .populate("user", "username fullname avatar")
    .lean();

  // Attach members list to each project object
  const projectsWithMembers = projects.map((p) => {
    const projectMembers = allMembers.filter((m) => m.project.toString() === p._id.toString());
    return {
      ...p,
      members: projectMembers,
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, projectsWithMembers, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const memberShipsCheck = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    project: new mongoose.Types.ObjectId(projectId),
  }).lean();

  if (!memberShipsCheck) {
    return res
      .status(400)
      .json(new ApiError(400, "You're not part of this project"));
  }

  const project = await Project.findById(projectId).populate(
    "createdBy",
    "username fullname avatar",
  ).lean();

  if (!project) {
    return res.status(400).json(new ApiError(400, "Project not found"));
  }

  const projectMembers = await ProjectMember.find({
    project: new mongoose.Types.ObjectId(projectId),
  })
    .populate("user", "username fullname avatar")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { project, projectMembers },
        "Projects fetched successfully",
      ),
    );
});

const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description, workspaceId, batchId, startDate, endDate, groupNumber } = req.body;

  if (!name || !description) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  if (workspaceId) {
    const workspace = await InstitutionWorkspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json(new ApiError(404, "Workspace not found"));
    }

    const isHod = workspace.authorizedHods.some(
      (hodId) => hodId.toString() === userId.toString()
    );

    if (!isHod) {
      return res
        .status(403)
        .json(
          new ApiError(
            403,
            "Only HODs can manually create projects in an institutional workspace."
          )
        );
    }
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json(new ApiError(400, "User not found"));
  }

  const project = await Project.create({
    name,
    description,
    createdBy: user._id,
    workspaceId: workspaceId || null,
    batchId: batchId || null,
    groupNumber: groupNumber ? Number(groupNumber) : null,
    startDate: startDate || null,
    endDate: endDate || null,
    milestones: generateDynamicTimeline(startDate, endDate),
  });

  await ProjectMember.create({
    project: project._id,
    user: user._id,
    role: UserRolesEnum.ADMIN,
  });

  if (!project) {
    return res.status(400).json(new ApiError(400, "Failed to create project"));
  }

  const notification = await Notification.create({
    userId: user._id,
    type: "project_added",
    message: `Project "${name}" created successfully`,
    description: `You created a new project`,
    projectId: project._id,
    read: false,
    metadata: {
      projectName: name,
      actorName: user.fullname,
      actorId: user._id,
    },
  });


  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, githubRepoUrl } = req.body;

  if (!name || !description) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const existingProject = await Project.findById(projectId);

  if (!existingProject) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const updatePayload = { name, description };
  if (githubRepoUrl !== undefined) {
    updatePayload.githubRepoUrl = githubRepoUrl;
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    updatePayload,
    { new: true },
  ).populate("createdBy", "username fullname avatar");

  const updater = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        userId: member.user,
        type: "project_updated",
        message: `Project "${name}" was updated`,
        description: `${updater.fullname} updated the project details`,
        projectId: new mongoose.Types.ObjectId(projectId),
        read: false,
        metadata: {
          projectName: name,
          actorName: updater.fullname,
          actorId: updater._id,
        },
      });

    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const projectName = project.name;
  const deleter = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        userId: member.user,
        type: "project_updated",
        message: `Project "${projectName}" was deleted`,
        description: `${deleter.fullname} deleted the project`,
        read: false,
        metadata: {
          projectName: projectName,
          actorName: deleter.fullname,
          actorId: deleter._id,
        },
      });

    }
  }

  const taskCount = await ProjectTask.countDocuments({ project: projectId });

  if (taskCount === 0) {
    await Project.findByIdAndDelete(projectId);
    await ProjectMember.deleteMany({ project: projectId, deletedAt: { $exists: true } });
    await ProjectNote.deleteMany({ project: projectId, deletedAt: { $exists: true } });
  } else {
    // Has tasks — soft-delete the project and cascade to all children
    const now = new Date();
    await Project.findByIdAndUpdate(projectId, { deletedAt: now });
    await ProjectMember.updateMany(
      { project: projectId, deletedAt: null },
      { deletedAt: now },
    );
    await ProjectTask.updateMany(
      { project: projectId, deletedAt: null },
      { deletedAt: now },
    );
    await ProjectSubTask.updateMany(
      { project: projectId, deletedAt: null },
      { deletedAt: now },
    );
    await ProjectNote.updateMany(
      { project: projectId, deletedAt: null },
      { deletedAt: now },
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const existingProject = await Project.findById(projectId).lean();

  if (!existingProject) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const projectMembers = await ProjectMember.find({
    project: new mongoose.Types.ObjectId(projectId),
  })
    .populate("user", "username fullname avatar")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, projectMembers, "Member fetched successfully"));
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;
  const currentUser = req.user._id;

  if (!email || !role) {
    return res.status(400).json(new ApiError(400, "All fields are required"));
  }

  const admin = await User.findById(currentUser);
  if (!admin) {
    return res.status(400).json(new ApiError(400, "admin not registered"));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json(new ApiError(400, "User not registered"));
  }
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(400).json(new ApiError(400, "Project not found"));
  }

  const existingMember = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(user._id),
    project: new mongoose.Types.ObjectId(project._id),
  });

  if (existingMember) {
    return res.status(400).json(new ApiError(400, "User already a member"));
  }

  if (!project.workspaceId) {
    if (user.planType === PlanTypeEnum.FREE) {
      const memberships = await ProjectMember.find({ user: user._id }).select(
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
              "Cannot add user. This user is on a Free plan and is already participating in their maximum allowed personal projects.",
            ),
          );
      }
    }
  }

  const member = await ProjectMember.create({
    user: user._id,
    project: project._id,
    role,
  });

  if (!member) {
    return res.status(400).json(new ApiError(400, "Member not created"));
  }

  const notification = await Notification.create({
    userId: user._id,
    type: "project_added",
    message: `You were added to "${project.name}"`,
    description: `${admin.fullname} added you as a team member`,
    projectId: project._id,
    read: false,
    metadata: {
      projectName: project.name,
      actorName: admin.fullname,
      actorId: admin._id,
    },
  });


  const projectMembers = await ProjectMember.find({ project: projectId });

  const otherMembers = projectMembers.filter(
    (m) => m.user.toString() !== user._id.toString(),
  );

  for (const member of otherMembers) {
    const notification = await Notification.create({
      userId: member.user,
      type: "member_joined",
      message: `${user.fullname} joined your project`,
      description: `${project.name} has a new team member`,
      projectId: project._id,
      read: false,
      metadata: {
        projectName: project.name,
        newMemberName: user.fullname,
        newMemberId: user._id,
      }
    });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, member, "Member created successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;

  const deletedMember = await ProjectMember.findOneAndUpdate(
    {
      user: new mongoose.Types.ObjectId(memberId),
      project: new mongoose.Types.ObjectId(projectId),
    },
    { deletedAt: new Date() },
    { new: true },
  );

  if (!deletedMember) {
    return res
      .status(404)
      .json(new ApiError(404, "Member not found or already removed"));
  }

  const project = await Project.findById(projectId);
  const remover = await User.findById(req.user._id);
  const removedUser = await User.findById(memberId);

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(memberId),
    type: "member_removed",
    message: `You were removed from "${project.name}"`,
    description: `${remover.fullname} removed you from the project`,
    projectId: new mongoose.Types.ObjectId(projectId),
    read: false,
    metadata: {
      projectName: project.name,
      actorName: remover.fullname,
      actorId: remover._id,
    },
  });


  const projectMembers = await ProjectMember.find({ project: projectId });
  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      const notification = await Notification.create({
        userId: member.user,
        type: "member_removed",
        message: `${removedUser.fullname} left "${project.name}"`,
        description: `${remover.fullname} removed a team member`,
        projectId: new mongoose.Types.ObjectId(projectId),
        read: false,
        metadata: {
          projectName: project.name,
          removedUserName: removedUser.fullname,
          actorName: remover.fullname,
          actorId: remover._id,
        },
      });
    }
  }

  clearProjectCommitCache(projectId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedMember, "Member deleted successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const member = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(memberId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!member) {
    return res
      .status(404)
      .json(new ApiError(404, "Member not found or already removed"));
  }

  const oldRole = member.role;
  member.role = role;
  await member.save();

  const populatedMember = await ProjectMember.findById(member._id)
    .select("role")
    .populate("user", "username fullname avatar");

  const project = await Project.findById(projectId);
  const updater = await User.findById(req.user._id);
  const updatedUser = await User.findById(memberId);

  const notification = await Notification.create({
    userId: new mongoose.Types.ObjectId(memberId),
    type: "project_updated",
    message: `Your role in "${project.name}" was updated`,
    description: `${updater.fullname} changed your role from ${oldRole} to ${role}`,
    projectId: new mongoose.Types.ObjectId(projectId),
    read: false,
    metadata: {
      projectName: project.name,
      oldRole: oldRole,
      newRole: role,
      actorName: updater.fullname,
      actorId: updater._id,
    },
  });


  const projectMembers = await ProjectMember.find({ project: projectId });
  for (const projectMember of projectMembers) {
    if (projectMember.user.toString() !== req.user._id.toString() &&
      projectMember.user.toString() !== memberId.toString()) {
      const notification = await Notification.create({
        userId: projectMember.user,
        type: "project_updated",
        message: `Team role updated in "${project.name}"`,
        description: `${updater.fullname} changed ${updatedUser.fullname}'s role to ${role}`,
        projectId: new mongoose.Types.ObjectId(projectId),
        read: false,
        metadata: {
          projectName: project.name,
          updatedUserName: updatedUser.fullname,
          newRole: role,
          actorName: updater.fullname,
          actorId: updater._id,
        },
      });
    }
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedMember, "Member role updated successfully"),
    );
});

const updateMemberGithub = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;
  const { githubUsername } = req.body;

  if (githubUsername === undefined) {
    return res.status(400).json(new ApiError(400, "githubUsername is required"));
  }

  // Verify the requester is an admin or project_admin for this project
  const requesterMembership = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (
    !requesterMembership ||
    (requesterMembership.role !== UserRolesEnum.ADMIN &&
      requesterMembership.role !== UserRolesEnum.PROJECT_ADMIN)
  ) {
    return res
      .status(403)
      .json(new ApiError(403, "You do not have permission to perform this action"));
  }

  const member = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(memberId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!member) {
    return res.status(404).json(new ApiError(404, "Member not found"));
  }

  member.githubUsername = githubUsername;
  await member.save();

  const populatedMember = await ProjectMember.findById(member._id).populate(
    "user",
    "username fullname avatar",
  );

  // Bust the Code Track cache — the github username mapping has changed
  clearProjectCommitCache(projectId);

  return res
    .status(200)
    .json(new ApiResponse(200, populatedMember, "GitHub username updated successfully"));
});

const updateMilestone = asyncHandler(async (req, res) => {
  const { projectId, milestoneId } = req.params;
  const { title, description } = req.body;

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json(new ApiError(404, "Project not found"));

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) return res.status(404).json(new ApiError(404, "Milestone not found"));

  // Prevent students from editing a week that has already been graded
  let userRole = req.userRole;
  if (!userRole) {
    const member = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id),
    });
    userRole = member?.role;
  }

  if (milestone.status !== "PENDING" && userRole !== UserRolesEnum.ADMIN) {
    return res.status(400).json(new ApiError(400, "Cannot edit a milestone that has already been evaluated."));
  }

  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;

  await project.save();

  return res.status(200).json(new ApiResponse(200, milestone, "Milestone updated successfully"));
});

const evaluateMilestone = asyncHandler(async (req, res) => {
  const { projectId, milestoneId } = req.params;
  const { status } = req.body; // Expecting "APPROVED", "DELAYED", or "PENDING"

  if (!["PENDING", "APPROVED", "DELAYED"].includes(status)) {
    return res.status(400).json(new ApiError(400, "Invalid status"));
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json(new ApiError(404, "Project not found"));

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) return res.status(404).json(new ApiError(404, "Milestone not found"));

  milestone.status = status;

  // If moving out of pending, record who did it and when
  if (status !== "PENDING") {
    milestone.evaluatedBy = req.user._id;
    milestone.evaluatedAt = new Date();
  } else {
    milestone.evaluatedBy = null;
    milestone.evaluatedAt = null;
  }

  await project.save();

  return res.status(200).json(new ApiResponse(200, milestone, `Milestone marked as ${status}`));
});

const initializeTimeline = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json(new ApiError(400, "Start date and End date are required"));
  }

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json(new ApiError(404, "Project not found"));

  if (project.milestones && project.milestones.length > 0) {
    return res.status(400).json(new ApiError(400, "Timeline has already been initialized"));
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json(new ApiError(400, "Invalid start date or end date format"));
  }

  if (start >= end) {
    return res.status(400).json(new ApiError(400, "End date must be strictly after the start date"));
  }

  project.startDate = start;
  project.endDate = end;
  project.milestones = generateDynamicTimeline(start, end);
  await project.save();

  return res.status(200).json(new ApiResponse(200, project, "Timeline initialized successfully"));
});

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  evaluateMilestone,
  generateDynamicTimeline,
  getProjectById,
  getProjectMembers,
  getProjects,
  initializeTimeline,
  updateMemberGithub,
  updateMemberRole,
  updateMilestone,
  updateProject,
};
