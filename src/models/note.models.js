import mongoose, { Schema } from "mongoose";
import { AvailableNoteCategories } from "../utils/constants.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const projectNoteSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: AvailableNoteCategories,
      default: "general",
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

projectNoteSchema.plugin(softDeletePlugin);

projectNoteSchema.index({ project: 1 });
projectNoteSchema.index({ createdBy: 1 });

export const ProjectNote = mongoose.model("ProjectNote", projectNoteSchema);
