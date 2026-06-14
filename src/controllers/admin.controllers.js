import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Feedback } from "../models/feedback.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AvailableFeedbackStatuses } from "../utils/constants.js";

const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeProjects = await Project.countDocuments();
  const totalFeedback = await Feedback.countDocuments();
  
  const recentFeedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "username email fullname avatar");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        activeProjects,
        totalFeedback,
        recentFeedback,
      },
      "Admin stats fetched successfully"
    )
  );
});

const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;

  if (!status || !AvailableFeedbackStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid feedback status value" });
  }

  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true }
  ).populate("user", "username email fullname avatar");

  if (!feedback) {
    return res.status(404).json({ message: "Feedback record not found" });
  }

  return res.status(200).json(
    new ApiResponse(200, feedback, "Feedback status updated successfully")
  );
});

export { getAdminStats, updateFeedbackStatus };
