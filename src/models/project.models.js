import mongoose, { Schema } from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    githubRepoUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

projectSchema.plugin(softDeletePlugin);

projectSchema.index({ createdBy: 1 });

export const Project = mongoose.model("Project", projectSchema);
