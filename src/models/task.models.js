import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants.js";
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
  },
  {
    timestamps: true,
  },
);

export const ProjectTask = mongoose.model("Task", taskSchema);
