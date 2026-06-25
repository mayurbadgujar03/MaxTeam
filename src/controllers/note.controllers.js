import { Project } from "../models/project.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectNote } from "../models/note.models.js";
import { Notification } from "../models/notification.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum, AvailableNoteCategories } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Helper – resolve the current user's role in a project
// ---------------------------------------------------------------------------
async function getMemberRole(userId, projectId) {
  const membership = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(userId),
    project: new mongoose.Types.ObjectId(projectId),
  });
  return membership?.role ?? null;
}

// ---------------------------------------------------------------------------
// GET /:projectId  —  fetch all notes, pinned first then newest
// ---------------------------------------------------------------------------
const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId).lean();
  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  })
    .populate("createdBy", "username fullname avatar")
    .populate("updatedBy", "username fullname avatar")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean(); // pinned first, then newest

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

// ---------------------------------------------------------------------------
// GET /:projectId/n/:noteId  —  fetch a single note
// ---------------------------------------------------------------------------
const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId)
    .populate("createdBy", "username fullname avatar")
    .populate("updatedBy", "username fullname avatar")
    .lean();

  if (!note) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note fetched successfully"));
});

// ---------------------------------------------------------------------------
// POST /:projectId  —  create a note
// All roles can create; category & isPinned are accepted but only stored if valid.
// ---------------------------------------------------------------------------
const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { title = "", content, category = "general", isPinned = false } = req.body;

  if (!content) {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }

  // Validate category against the enum (graceful fallback to "general")
  const safeCategory = AvailableNoteCategories.includes(category) ? category : "general";

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const note = await ProjectNote.create({
    project: new mongoose.Types.ObjectId(projectId),
    createdBy: new mongoose.Types.ObjectId(req.user._id),
    title: title.trim(),
    content,
    category: safeCategory,
    isPinned: Boolean(isPinned),
  });

  const populatedNote = await ProjectNote.findById(note._id)
    .populate("createdBy", "username fullname avatar")
    .populate("updatedBy", "username fullname avatar");

  // Notify all other project members
  const creator = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "project_updated",
        message: `New note added in "${project.name}"`,
        description: `${creator.fullname} added a new note${title ? `: "${title.trim()}"` : ""}`,
        projectId: projectId,
        read: false,
        metadata: {
          projectName: project.name,
          actorName: creator.fullname,
          actorId: creator._id,
        },
      });
    }
  }



  return res
    .status(201)
    .json(new ApiResponse(201, populatedNote, "Note created successfully"));
});

// ---------------------------------------------------------------------------
// PUT /:projectId/n/:noteId  —  update a note
// SECURITY: MEMBER may only edit notes they created.
//           ADMIN / PROJECT_ADMIN may edit any note.
// ---------------------------------------------------------------------------
const updateNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;
  const { title, content, category, isPinned } = req.body;

  const existingNote = await ProjectNote.findById(noteId);
  if (!existingNote) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  // Ownership check for MEMBER role
  const requesterRole = await getMemberRole(req.user._id, projectId);
  const isPrivileged =
    requesterRole === UserRolesEnum.ADMIN ||
    requesterRole === UserRolesEnum.PROJECT_ADMIN;

  if (!isPrivileged) {
    // Must be a member — enforce ownership
    if (existingNote.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(new ApiError(403, "You can only edit notes you created"));
    }
  }

  // Build the update payload — only include fields that were actually sent
  const updatePayload = { updatedBy: req.user._id };
  if (title !== undefined)   updatePayload.title    = title.trim();
  if (content !== undefined) updatePayload.content  = content;
  if (category !== undefined && AvailableNoteCategories.includes(category)) {
    updatePayload.category = category;
  }
  if (isPinned !== undefined) updatePayload.isPinned = Boolean(isPinned);

  const note = await ProjectNote.findByIdAndUpdate(
    noteId,
    updatePayload,
    { new: true },
  )
    .populate("createdBy", "username fullname avatar")
    .populate("updatedBy", "username fullname avatar");

  // Notify other project members
  const updater = await User.findById(req.user._id);
  const project = await Project.findById(existingNote.project);
  const projectMembers = await ProjectMember.find({ project: existingNote.project });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "project_updated",
        message: `Note updated in "${project.name}"`,
        description: `${updater.fullname} updated a note`,
        projectId: existingNote.project,
        read: false,
        metadata: {
          projectName: project.name,
          actorName: updater.fullname,
          actorId: updater._id,
        },
      });
    }
  }



  return res
    .status(200)
    .json(new ApiResponse(200, note, "Note updated successfully"));
});

// ---------------------------------------------------------------------------
// DELETE /:projectId/n/:noteId  —  delete a note
// SECURITY: Same ownership rule as updateNote.
// ---------------------------------------------------------------------------
const deleteNote = asyncHandler(async (req, res) => {
  const { projectId, noteId } = req.params;

  const note = await ProjectNote.findById(noteId);
  if (!note) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  // Ownership check for MEMBER role
  const requesterRole = await getMemberRole(req.user._id, projectId);
  const isPrivileged =
    requesterRole === UserRolesEnum.ADMIN ||
    requesterRole === UserRolesEnum.PROJECT_ADMIN;

  if (!isPrivileged) {
    if (note.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json(new ApiError(403, "You can only delete notes you created"));
    }
  }

  // Notify before deletion so we still have project context
  const deleter = await User.findById(req.user._id);
  const project = await Project.findById(note.project);
  const projectMembers = await ProjectMember.find({ project: note.project });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "project_updated",
        message: `Note deleted in "${project.name}"`,
        description: `${deleter.fullname} deleted a note`,
        projectId: note.project,
        read: false,
        metadata: {
          projectName: project.name,
          actorName: deleter.fullname,
          actorId: deleter._id,
        },
      });
    }
  }

  await ProjectNote.findByIdAndUpdate(noteId, { deletedAt: new Date() });



  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
