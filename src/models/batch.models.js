import mongoose, { Schema } from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const batchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionWorkspace",
      required: true,
    },
    coordinators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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

batchSchema.plugin(softDeletePlugin);

batchSchema.index({ workspaceId: 1 });

export const Batch = mongoose.model("Batch", batchSchema);
