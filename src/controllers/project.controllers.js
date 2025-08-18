import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import { UserRolesEnum } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import mongoose from "mongoose";

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberShips = await ProjectMember.find({
    user: new mongoose.Types.ObjectId(userId),
  }).select("project");

  if (!memberShips.length) {
    return res.status(200).json(new ApiResponse(200, [], "No projects found"));
  }

  const projectIds = memberShips.map((m) => m.project);

  const projects = await Project.find({ _id: { $in: projectIds } });

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;

  const memberShipsCheck = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!memberShipsCheck) {
    return res
      .status(400)
      .json(new ApiError(400, "You're not part of this project"));
  }

  const project = await Project.findById(projectId).populate(
    "createdBy",
    "username fullname avatar",
  );

  if (!project) {
    return res.status(400).json(new ApiError(400, "Project not found"));
  }

  const projectMembers = await ProjectMember.find({
    project: mongoose.Types.ObjectId(projectId),
  }).populate("user", "username fullname avatar");

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

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const existingProject = await Project.findById(projectId);

  if (!existingProject) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const project = await Project.findByIdAndUpdate(
    projectId,
    { name, description },
    { new: true },
  ).populate("createdBy", "username fullname avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  await ProjectMember.deleteMany({ project: projectId });
  await ProjectNote.deleteMany({ project: projectId });

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const existingProject = await Project.findById(projectId);

  if (!existingProject) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const projectMembers = await ProjectMember.find({
    project: mongoose.Types.ObjectId(projectId),
  }).populate("user", "username fullname avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, projectMembers, "Member fetched successfully"));
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
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

  return res
    .status(200)
    .json(new ApiResponse(200, member, "Member created successfully"));
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, memberId } = req.params;

  const deletedMember = await ProjectMember.findOneAndDelete({
    user: new mongoose.Types.ObjectId(memberId),
    project: new mongoose.Types.ObjectId(projectId),
  });

  if (!deletedMember) {
    return res
      .status(404)
      .json(new ApiError(404, "Member not found or already removed"));
  }

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

  member.role = role;
  await member.save();

  const populatedMember = await ProjectMember.findById(member._id).select("role").populate(
    "user",
    "username fullName avatar"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, populatedMember, "Member role updated successfully"));
});

export {
  addMemberToProject,
  createProject,
  deleteMember,
  deleteProject,
  getProjectById,
  getProjectMembers,
  getProjects,
  updateMemberRole,
  updateProject,
};
