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

const updateTask = asyncHandler(async (req, res) => {
  console.log("working")
    const { taskId } = req.params;
    const { title, description, status, assignedTo } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;

    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
      }));
      task.attachments.push(...newFiles);
    }

    await task.save();

    return res
      .status(200)
      .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  console.log("working")
    const { taskId } = req.params;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json(new ApiError(404, "Task not found"));
    }

    await SubTask.deleteMany({ task: taskId });

    await task.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Task and subtasks deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json(new ApiError(400, "Title is required"));
    }

    const subtask = await SubTask.create({
      title,
      tasks: taskId,
      createdBy: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { subtaskId } = req.params;
    const { title, isCompleted } = req.body;

    const subtask = await SubTask.findById(subtaskId);

    if (!subtask) {
      return res.status(404).json(new ApiError(404, "Subtask not found"));
    }

    if (title) subtask.title = title;
    if (isCompleted !== undefined) subtask.isCompleted = isCompleted;

    await subtask.save();

    return res
      .status(200)
      .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { subtaskId } = req.params;

    const subtask = await SubTask.findById(subtaskId);

    if (!subtask) {
      return res.status(404).json(new ApiError(404, "Subtask not found"));
    }

    await subtask.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});

export {
  createSubTask,
  createTask,
  deleteSubTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateSubTask,
  updateTask,
};