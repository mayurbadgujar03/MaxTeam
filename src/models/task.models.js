import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";
const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: AvailableTaskStatuses,
      default: TaskStatusEnum.TODO,
    },
    links: {
      type: [
        {
          url: { type: String, required: true },
          title: { type: String },
          siteName: { type: String },
          description: { type: String },
          image: { type: String },
        }
      ],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

taskSchema.plugin(softDeletePlugin);

taskSchema.index({ project: 1 });
taskSchema.index({ assignedTo: 1 });

export const ProjectTask = mongoose.model("Task", taskSchema);
