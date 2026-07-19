import mongoose, { Schema } from "mongoose";
import { AvailableCommentEntityTypes } from "../utils/constants.js";
import { softDeletePlugin } from "../utils/softDeletePlugin.js";

const commentSchema = new Schema(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entityType: {
      type: String,
      enum: AvailableCommentEntityTypes,
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    mentions: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

commentSchema.plugin(softDeletePlugin);

commentSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
commentSchema.index({ mentions: 1, createdAt: -1 });

export const Comment = mongoose.model("Comment", commentSchema);
