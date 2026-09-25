import mongoose, { Schema } from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";
import { AvailableDocumentFileTypes } from "../utils/constants.js";

const documentSubSchema = {
  url: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
  },
  fileType: {
    type: String,
    enum: AvailableDocumentFileTypes,
  },
  fileSize: {
    type: Number,
  },
  uploadedAt: {
    type: Date,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
};

const milestoneSubSchema = new Schema({
  weekNumber: { type: Number, required: true },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  status: { 
    type: String, 
    enum: ["PENDING", "APPROVED", "DELAYED"], 
    default: "PENDING" 
  },
  evaluatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  evaluatedAt: { type: Date, default: null }
});

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
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
    isFrozen: {
      type: Boolean,
      default: false,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionWorkspace",
      default: null,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    documents: {
      report: [documentSubSchema],
      presentation: [documentSubSchema],
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    milestones: [milestoneSubSchema],
  },
  {
    timestamps: true,
  },
);

projectSchema.plugin(softDeletePlugin);

projectSchema.index({ createdBy: 1 });
projectSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export const Project = mongoose.model("Project", projectSchema);
