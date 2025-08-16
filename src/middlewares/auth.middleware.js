import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";

dotenv.config();

const isLoggedIn = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json(new ApiError(401, "Unauthorized"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json(new ApiError(403, "Invalid or expired token"));
  }
};

const validateProjectPermission = (roles = []) =>
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      return res
        .status(403)
        .json(new ApiError(403, "Invalid or expired token"));
    }

    const project = await ProjectMember.findOne({
      project: mongoose.Types.ObjectId(projectId),
      user: mongoose.Types.ObjectId(req.user._id),
    });

    if (!project) {
      return res.status(403).json(new ApiError(403, "Project not found"));
    }

    const givenRole = project?.role;

    if (!roles.includes(givenRole)) {
      return res
        .status(403)
        .json(
          new ApiError(
            403,
            "You do not have permission to perform this action",
          ),
        );
    }

    next();
  });

export { isLoggedIn, validateProjectPermission };
