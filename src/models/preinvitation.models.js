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
      required: true,
    },
    role: {
      type: String,
      enum: AvailableUserRoles,
      default: UserRolesEnum.MEMBER,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "InstitutionWorkspace",
    },
  },
  {
    timestamps: true,
  },
);

preInvitationSchema.index({ email: 1, projectId: 1 }, { unique: true });

export const PreInvitation = mongoose.model("PreInvitation", preInvitationSchema);
