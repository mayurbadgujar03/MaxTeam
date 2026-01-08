import { Project } from "../models/project.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectNote } from "../models/note.models.js";
import { Notification } from "../models/notification.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(403).json(new ApiError(403, "Project not found"));
  }

  const notes = await ProjectNote.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("createdBy", "username fullname avatar");

  return res
    .status(200)
    .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId).populate(
    "createdBy",
    "username fullname avatar",
  );

  if (!note) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, note, "Notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const note = await ProjectNote.create({
    project: new mongoose.Types.ObjectId(projectId),
    content,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  const populatedNote = await ProjectNote.findById(note._id).populate(
    "createdBy",
    "username fullname avatar",
  );

  const creator = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          userId: member.user,
          type: "project_updated",
          message: `New note added in "${project.name}"`,
          description: `${creator.fullname} added a new note`,
          projectId: projectId,
          read: false,
          metadata: {
            projectName: project.name,
            actorName: creator.fullname,
            actorId: creator._id,
          },
        });
        const io = req.app.get("io");
        if (io) {
          io.to(notification.userId.toString()).emit("notification_received", notification);
        }
    }
  }

  const io = req.app.get("io");
  if (io) {
    const room = projectId || (note && note.project);
    io.to(room.toString()).emit("project_data_updated", { type: "note_update" });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, populatedNote, "Notes Created successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const existingNote = await ProjectNote.findById(noteId);

  if (!existingNote) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  const note = await ProjectNote.findByIdAndUpdate(
    noteId,
    { content },
    { new: true },
  ).populate("createdBy", "username fullname avatar");

  const updater = await User.findById(req.user._id);
  const project = await Project.findById(existingNote.project);
  const projectMembers = await ProjectMember.find({ project: existingNote.project });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
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
        const io = req.app.get("io");
        if (io) {
          io.to(notification.userId.toString()).emit("notification_received", notification);
        }
    }
  }

  const io = req.app.get("io");
  if (io) {
    const room = existingNote.project;
    io.to(room.toString()).emit("project_data_updated", { type: "note_update" });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, "Notes updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;

  const note = await ProjectNote.findById(noteId);

  if (!note) {
    return res.status(404).json(new ApiError(404, "Note not found"));
  }

  const deleter = await User.findById(req.user._id);
  const project = await Project.findById(note.project);
  const projectMembers = await ProjectMember.find({ project: note.project });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
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
        const io = req.app.get("io");
        if (io) {
          io.to(notification.userId.toString()).emit("notification_received", notification);
        }
    }
  }

  await ProjectNote.findByIdAndDelete(noteId);

  const io = req.app.get("io");
  if (io) {
    const room = note.project;
    io.to(room.toString()).emit("project_data_updated", { type: "note_update" });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, note, "Notes deleted successfully"));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
