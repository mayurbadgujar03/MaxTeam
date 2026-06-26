import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ProjectTask } from "../models/task.models.js";
import { ProjectSubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Notification } from "../models/notification.models.js";
import { clearProjectCommitCache } from "./codetrack.controllers.js";
import mongoose from "mongoose";

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberShips = await ProjectMember.find({
    user: new mongoose.Types.ObjectId(userId),
  })
    .select("project")
    .lean();

  if (!memberShips.length) {
    return res.status(200).json(new ApiResponse(200, [], "No projects found"));
  }

  const projectIds = memberShips.map((m) => m.project);

  const projects = await Project.find({ _id: { $in: projectIds } }).lean();

  // Fetch all members for these projects
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
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json(new ApiError(400, "User not found"));
  }

  const project = await Project.create({
    name,
    description,
    createdBy: user._id,
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
  const { name, description, githubRepoUrl, canvaUrl, overleafUrl } = req.body;

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
  if (canvaUrl !== undefined) {
    updatePayload.canvaUrl = canvaUrl;
  }
  if (overleafUrl !== undefined) {
    updatePayload.overleafUrl = overleafUrl;
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

  // ── Smart Delete: hard-delete empty projects, soft-delete populated ones ──
  const taskCount = await ProjectTask.countDocuments({ project: projectId });

  if (taskCount === 0) {
    // No tasks — accidental/empty project, purge entirely from the database
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

  // Bust the Code Track cache — the member list has changed
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

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberGithub,
  updateMemberRole,
  updateProject,
};
