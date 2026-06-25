import mongoose, { mongo, Schema } from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const subtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

subtaskSchema.plugin(softDeletePlugin);

subtaskSchema.index({ task: 1 });
subtaskSchema.index({ project: 1 });

export const ProjectSubTask = mongoose.model("SubTask", subtaskSchema);
