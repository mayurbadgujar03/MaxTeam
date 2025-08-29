import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await Task.find({ project: projectId })
    .populate("assignedBy", "username fullName")
    .populate("assignedTo", "username fullName")
    .lean();

  const tasksWithSubtasks = await Promise.all(
    tasks.map(async (task) => {
      const subtasks = await SubTask.find({ task: task._id }).lean();
      return { ...task, subtasks };
    }),
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, tasksWithSubtasks, "Tasks fetched successfully"),
    );
});

const getTaskById = asyncHandler(async (req, res) => {
  console.log("working")
    const { taskId } = req.params;

    const task = await Task.findById(taskId)
      .populate("assignedBy", "username fullName")
      .populate("assignedTo", "username fullName")
      .lean();

    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    const subtasks = await SubTask.find({ task: taskId }).lean();

    return res
      .status(200)
      .json(new ApiResponse(200, { ...task, subtasks }, "Task fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo } = req.body;
    const { projectId } = req.params;

    if (!title) {
      return res.status(400).json(new ApiError(400, "Title is required"));
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        url: `/images/${file.filename}.jpg`,
        mimetype: file.mimetype,
        size: file.size,
      }));
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedBy: req.user._id,
      assignedTo: assignedTo || null,
      attachments,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, task, "Task created successfully"));
});