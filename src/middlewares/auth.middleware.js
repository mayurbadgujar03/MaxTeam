import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";

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

export default isLoggedIn;
