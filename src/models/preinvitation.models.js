import mongoose, { Schema } from "mongoose";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";

const preInvitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.MEMBER,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionWorkspace",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

preInvitationSchema.index({ email: 1, projectId: 1 }, { unique: true, sparse: true });
preInvitationSchema.index({ email: 1, workspaceId: 1 }, { sparse: true });

export const PreInvitation = mongoose.model("PreInvitation", preInvitationSchema);
