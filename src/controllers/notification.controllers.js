import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Notification } from "../models/notification.models.js";
import { Project } from "../models/project.models.js";
import { ProjectTask } from "../models/task.models.js";
import mongoose from "mongoose";

const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { limit = 50, skip = 0, read } = req.query;

  const filter = { userId: userId };

  if (read !== undefined) {
    filter.read = read === "true";
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip))
    .populate("projectId", "name")
    .populate("taskId", "name");

  const totalCount = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({
    userId: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        totalCount,
        unreadCount,
      },
      "Notifications fetched successfully",
    ),
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId: userId,
    },
    { read: true },
    { new: true },
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.updateMany(
    { userId: userId, read: false },
    { read: true },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        modifiedCount: result.modifiedCount,
      },
      "All notifications marked as read",
    ),
  );
});

const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Notification deleted successfully"));
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.deleteMany({
    userId: userId,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deletedCount: result.deletedCount,
      },
      "All notifications deleted successfully",
    ),
  );
});

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
