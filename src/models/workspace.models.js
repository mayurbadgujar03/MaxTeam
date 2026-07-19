import mongoose, { Schema } from "mongoose";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const workspaceSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    authorizedHods: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    planEndsAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

workspaceSchema.plugin(softDeletePlugin);

export const InstitutionWorkspace = mongoose.model(
  "InstitutionWorkspace",
  workspaceSchema,
);
