import mongoose, { mongo, Schema } from "mongoose";

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
      ref: "ProjectTask",
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

export const ProjectSubTask = mongoose.model("SubTask", subtaskSchema);
