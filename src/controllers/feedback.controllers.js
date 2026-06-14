import { Feedback } from "../models/feedback.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { FeedbackTypeEnum } from "../utils/constants.js";
import jwt from "jsonwebtoken";

const createFeedback = asyncHandler(async (req, res) => {
  const { message, type } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Feedback message is required" });
  }

  let userId = null;
  const token = req.cookies?.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      userId = decoded?._id;
    } catch (err) {
      // Proceed anonymously if token is invalid or expired
    }
  }

  const feedback = await Feedback.create({
    message,
    type: type || FeedbackTypeEnum.GENERAL,
    user: userId || null,
  });

  return res.status(201).json(
    new ApiResponse(201, feedback, "Feedback submitted successfully")
  );
});

const getPublicStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  return res.status(200).json(
    new ApiResponse(200, { totalUsers }, "Public stats fetched successfully")
  );
});

export { createFeedback, getPublicStats };
