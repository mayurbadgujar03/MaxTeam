import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectTask } from "../models/task.models.js";
import { UserRolesEnum, TaskStatusEnum } from "../utils/constants.js";
import mongoose from "mongoose";

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const allMyProjects = await ProjectMember.find({ user: userId });
  const allProjectIds = allMyProjects.map((pm) => pm.project);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const taskStats = await ProjectTask.aggregate([
    {
      $match: {
        project: { $in: allProjectIds },
        assignedTo: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $facet: {
        activeTasks: [
          { $match: { status: { $ne: TaskStatusEnum.DONE } } },
          { $count: "count" },
        ],
        completedTasks: [
          {
            $match: {
              status: TaskStatusEnum.DONE,
              updatedAt: { $gte: sevenDaysAgo },
            },
          },
          { $count: "count" },
        ],
        overdueTasks: [
          {
            $match: {
              status: { $ne: TaskStatusEnum.DONE },
              dueDate: { $lt: new Date() },
            },
          },
          { $count: "count" },
        ],
      },
    },
  ]);

  const activeTasksCount = taskStats[0]?.activeTasks[0]?.count || 0;
  const completedTasksCount = taskStats[0]?.completedTasks[0]?.count || 0;
  const overdueTasksCount = taskStats[0]?.overdueTasks[0]?.count || 0;

  const priorityTasks = await ProjectTask.find({
    assignedTo: userId,
    status: { $ne: TaskStatusEnum.DONE },
  })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate("project", "name");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activeTasks: activeTasksCount,
        completedTasks: completedTasksCount,
        overdueTasks: overdueTasksCount,
        totalProjects: allProjectIds.length,
        priorityTasks,
      },
      "Dashboard stats fetched successfully",
    ),
  );
});

export { getDashboardStats };
