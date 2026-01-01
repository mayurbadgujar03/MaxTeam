import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectTask } from "../models/task.models.js";
import { ProjectSubTask } from "../models/subtask.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import { Notification } from "../models/notification.models.js";
import { Project } from "../models/project.models.js";
import { User } from "../models/user.models.js";
import { fetchLinkMetadata } from "../utils/link-utils.js";
import mongoose from "mongoose";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const tasks = await ProjectTask.find({ project: projectId })
    .populate("assignedBy", "username fullName")
    .populate("assignedTo", "username fullName")
    .lean();

  const tasksWithSubtasks = await Promise.all(
    tasks.map(async (task) => {
      const subtasks = await ProjectSubTask.find({ task: task._id }).lean();
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
  const { taskId } = req.params;

  const task = await ProjectTask.findById(taskId)
    .populate("assignedBy", "username fullName")
    .populate("assignedTo", "username fullName")
    .lean();

  if (!task) {
    return res.status(404).json(new ApiError(404, "Task not found"));
  }

  const subtasks = await ProjectSubTask.find({ task: taskId }).lean();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { ...task, subtasks }, "Task fetched successfully"),
    );
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status, links } = req.body;
  const { projectId } = req.params;

  if (!title) {
    return res.status(400).json(new ApiError(400, "Title is required"));
  }

  let linkMetadata = [];
  if (Array.isArray(links) && links.length > 0) {
    linkMetadata = await Promise.all(
      links.map(async (url) => fetchLinkMetadata(url))
    );
  }

  const task = await ProjectTask.create({
    title,
    description,
    project: projectId,
    assignedBy: req.user._id,
    assignedTo: assignedTo || null,
    status,
    links: linkMetadata,
  });

  const project = await Project.findById(projectId);
  const creator = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  if (assignedTo) {
    await Notification.create({
      userId: assignedTo,
      type: "task_assigned",
      message: `You were assigned to "${title}"`,
      description: `${creator.fullname} assigned you a new task in ${project.name}`,
      projectId: projectId,
      taskId: task._id,
      read: false,
      metadata: {
        projectName: project.name,
        taskTitle: title,
        actorName: creator.fullname,
        actorId: creator._id,
      },
    });
  }

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString() && 
        (!assignedTo || member.user.toString() !== assignedTo.toString())) {
      await Notification.create({
        userId: member.user,
        type: "task_assigned",
        message: `New task created: "${title}"`,
        description: `${creator.fullname} created a new task in ${project.name}`,
        projectId: projectId,
        taskId: task._id,
        read: false,
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;
  const { title, description, status, assignedTo, links } = req.body;

  const task = await ProjectTask.findById(taskId);
  if (!task) {
    return res.status(404).json(new ApiError(404, "Task not found"));
  }

  const memberRecord = await ProjectMember.findOne({
    user: req.user._id,
    project: projectId,
  });

  if (!memberRecord) {
    return res.status(403).json(
      new ApiError(403, "You are not a member of this project")
    );
  }

  const userRole = memberRecord.role;

  if (userRole === UserRolesEnum.MEMBER) {
    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        new ApiError(403, "You can only update tasks assigned to you")
      );
    }

    const updateFields = Object.keys(req.body);
    const allowedFields = ["status"];
    const hasDisallowedFields = updateFields.some(
      (field) => !allowedFields.includes(field)
    );

    if (hasDisallowedFields) {
      return res.status(403).json(
        new ApiError(403, "Members can only update task status")
      );
    }
  }
  const oldStatus = task.status;
  const oldAssignedTo = task.assignedTo;

  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;

  if (Array.isArray(links) && links.length > 0) {
    const newLinkMetadata = await Promise.all(
      links.map(async (url) => fetchLinkMetadata(url))
    );
    if (!Array.isArray(task.links)) task.links = [];
    task.links.push(...newLinkMetadata);
  }


  await task.save();

  const project = await Project.findById(projectId);
  const updater = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  if (assignedTo && assignedTo !== oldAssignedTo?.toString()) {
    await Notification.create({
      userId: assignedTo,
      type: "task_assigned",
      message: `You were assigned to "${task.title}"`,
      description: `${updater.fullname} assigned you a task in ${project.name}`,
      projectId: projectId,
      taskId: task._id,
      read: false,
    });
  }

  if (status === "completed" && oldStatus !== "completed") {
    for (const member of projectMembers) {
      if (member.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: member.user,
          type: "task_completed",
          message: `Task completed: "${task.title}"`,
          description: `${updater.fullname} marked a task as completed in ${project.name}`,
          projectId: projectId,
          taskId: task._id,
          read: false,
        });
      }
    }
  } else if (status || title || description) {
    for (const member of projectMembers) {
      if (member.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: member.user,
          type: "task_assigned",
          message: `Task updated: "${task.title}"`,
          description: `${updater.fullname} updated a task in ${project.name}`,
          projectId: projectId,
          taskId: task._id,
          read: false,
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;

  const task = await ProjectTask.findById(taskId);

  if (!task) {
    return res.status(404).json(new ApiError(404, "Task not found"));
  }

  const taskTitle = task.title;

  await ProjectSubTask.deleteMany({ task: taskId });
  await task.deleteOne();

  const project = await Project.findById(projectId);
  const deleter = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "task_assigned",
        message: `Task deleted: "${taskTitle}"`,
        description: `${deleter.fullname} deleted a task from ${project.name}`,
        projectId: projectId,
        read: false,
      });
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Task and subtasks deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json(new ApiError(400, "Title is required"));
  }

  const subtask = await ProjectSubTask.create({
    title,
    task: taskId,
    project: projectId,
    createdBy: req.user._id,
  });

  const task = await ProjectTask.findById(taskId);
  const project = await Project.findById(projectId);
  const creator = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "task_assigned",
        message: `New subtask added to "${task.title}"`,
        description: `${creator.fullname} added a subtask: "${title}"`,
        projectId: new mongoose.Types.ObjectId(projectId),
        taskId: new mongoose.Types.ObjectId(taskId),
        read: false,
        metadata: {
          projectName: project.name,
          taskTitle: task.title,
          subtaskTitle: title,
          actorName: creator.fullname,
          actorId: creator._id,
        },
      });
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;
  const { title, isCompleted } = req.body;

  const subtask = await ProjectSubTask.findById(subtaskId);

  if (!subtask) {
    return res.status(404).json(new ApiError(404, "Subtask not found"));
  }

  const oldCompleted = subtask.isCompleted;
  const oldTitle = subtask.title;

  if (title) subtask.title = title;
  if (isCompleted !== undefined) subtask.isCompleted = isCompleted;

  await subtask.save();

  const task = await ProjectTask.findById(subtask.task);
  const project = await Project.findById(subtask.project);
  const updater = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: subtask.project });

  if (isCompleted && !oldCompleted) {
    for (const member of projectMembers) {
      if (member.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: member.user,
          type: "task_completed",
          message: `Subtask completed: "${subtask.title}"`,
          description: `${updater.fullname} completed a subtask in "${task.title}"`,
          projectId: new mongoose.Types.ObjectId(subtask.project),
          taskId: new mongoose.Types.ObjectId(subtask.task),
          read: false,
          metadata: {
            projectName: project.name,
            taskTitle: task.title,
            subtaskTitle: subtask.title,
            actorName: updater.fullname,
            actorId: updater._id,
          },
        });
      }
    }
  } else if (title || isCompleted !== undefined) {
    for (const member of projectMembers) {
      if (member.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: member.user,
          type: "task_assigned",
          message: `Subtask updated in "${task.title}"`,
          description: `${updater.fullname} updated a subtask: "${subtask.title}"`,
          projectId: new mongoose.Types.ObjectId(subtask.project),
          taskId: new mongoose.Types.ObjectId(subtask.task),
          read: false,
          metadata: {
            projectName: project.name,
            taskTitle: task.title,
            subtaskTitle: subtask.title,
            actorName: updater.fullname,
            actorId: updater._id,
          },
        });
      }
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId } = req.params;

  const subtask = await ProjectSubTask.findById(subtaskId);

  if (!subtask) {
    return res.status(404).json(new ApiError(404, "Subtask not found"));
  }

  const subtaskTitle = subtask.title;
  const taskId = subtask.task;
  const projectId = subtask.project;

  await subtask.deleteOne();

  const task = await ProjectTask.findById(taskId);
  const project = await Project.findById(projectId);
  const deleter = await User.findById(req.user._id);
  const projectMembers = await ProjectMember.find({ project: projectId });

  for (const member of projectMembers) {
    if (member.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: member.user,
        type: "task_assigned",
        message: `Subtask deleted from "${task.title}"`,
        description: `${deleter.fullname} deleted a subtask: "${subtaskTitle}"`,
        projectId: new mongoose.Types.ObjectId(projectId),
        taskId: new mongoose.Types.ObjectId(taskId),
        read: false,
        metadata: {
          projectName: project.name,
          taskTitle: task.title,
          subtaskTitle: subtaskTitle,
          actorName: deleter.fullname,
          actorId: deleter._id,
        },
      });
    }
  }

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
