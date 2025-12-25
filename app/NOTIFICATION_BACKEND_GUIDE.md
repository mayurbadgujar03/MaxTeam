# Notification System - Backend Integration Guide

## Overview
This document describes how the backend should create and send notifications to users for various events.

## When to Send Notifications

### 1. PROJECT EVENTS

#### User Added to Project
**When**: A user is added as a member to a project
**Recipients**: The user who was added
**Example**:
```javascript
{
  userId: addedUser._id,
  type: 'project_added',
  message: `You were added to "${project.name}"`,
  description: `${currentUser.fullname} added you as a team member`,
  projectId: project._id,
  read: false,
  createdAt: new Date(),
  metadata: {
    projectName: project.name,
    actorName: currentUser.fullname,
    actorId: currentUser._id
  }
}
```

#### Project Updated
**When**: Project details are modified (name, description, deadline)
**Recipients**: All project members except the person who made the change
**Example**:
```javascript
{
  userId: member._id,
  type: 'project_updated',
  message: `"${project.name}" was updated`,
  description: `${currentUser.fullname} updated project details`,
  projectId: project._id,
  read: false,
  createdAt: new Date()
}
```

### 2. TASK EVENTS

#### Task Assigned
**When**: A task is assigned to a user
**Recipients**: The user who was assigned
**Example**:
```javascript
{
  userId: assignedUser._id,
  type: 'task_assigned',
  message: `New task assigned: "${task.title}"`,
  description: `${currentUser.fullname} assigned you a task in ${project.name}`,
  projectId: project._id,
  taskId: task._id,
  read: false,
  createdAt: new Date(),
  metadata: {
    taskTitle: task.title,
    projectName: project.name,
    actorName: currentUser.fullname
  }
}
```

#### Task Status Changed
**When**: Task status is updated (To Do → In Progress → Done)
**Recipients**: Task assignee and project owner
**Example**:
```javascript
{
  userId: task.assignedTo,
  type: 'task_updated',
  message: `Task updated: "${task.title}"`,
  description: `${currentUser.fullname} changed status to ${task.status} in ${project.name}`,
  projectId: project._id,
  taskId: task._id,
  read: false,
  createdAt: new Date()
}
```

#### Task Completed
**When**: A task is marked as completed
**Recipients**: Project owner and all team members
**Example**:
```javascript
{
  userId: member._id,
  type: 'task_completed',
  message: `Task completed: "${task.title}"`,
  description: `${currentUser.fullname} marked the task as done in ${project.name}`,
  projectId: project._id,
  taskId: task._id,
  read: false,
  createdAt: new Date()
}
```

#### Deadline Approaching
**When**: Task deadline is within 24 hours
**Recipients**: Task assignee
**Example**:
```javascript
{
  userId: task.assignedTo,
  type: 'deadline_approaching',
  message: `Deadline approaching: "${task.title}"`,
  description: `Due in ${timeRemaining} in ${project.name}`,
  projectId: project._id,
  taskId: task._id,
  read: false,
  createdAt: new Date()
}
```

### 3. MEMBER EVENTS

#### New Member Joined
**When**: A new member is added to a project
**Recipients**: All existing project members except the new member
**Example**:
```javascript
{
  userId: existingMember._id,
  type: 'member_joined',
  message: `${newMember.fullname} joined your project`,
  description: `${project.name} has a new team member`,
  projectId: project._id,
  read: false,
  createdAt: new Date()
}
```

#### Member Left
**When**: A member leaves or is removed from a project
**Recipients**: All remaining project members
**Example**:
```javascript
{
  userId: member._id,
  type: 'member_left',
  message: `${leftMember.fullname} left the project`,
  description: `${project.name} team has been updated`,
  projectId: project._id,
  read: false,
  createdAt: new Date()
}
```

### 4. COMMENT/MENTION EVENTS

#### User Mentioned
**When**: A user is @mentioned in a comment or note
**Recipients**: The mentioned user
**Example**:
```javascript
{
  userId: mentionedUser._id,
  type: 'mention',
  message: `${currentUser.fullname} mentioned you`,
  description: `"${commentPreview}" in ${context}`,
  projectId: project._id,
  taskId: task?._id, // Optional if in task
  read: false,
  createdAt: new Date()
}
```

## API Endpoints

The frontend expects these endpoints:

### GET /notifications
Returns all notifications for the current user
**Response**:
```javascript
{
  data: [
    {
      _id: 'notification-id',
      userId: 'user-id',
      type: 'task_assigned',
      message: 'New task assigned: "Fix bug"',
      description: 'John assigned you a task',
      projectId: 'project-id',
      taskId: 'task-id',
      read: false,
      createdAt: '2025-12-14T10:00:00Z'
    }
  ]
}
```

### GET /notifications/unread-count
Returns count of unread notifications
**Response**:
```javascript
{
  data: {
    count: 5
  }
}
```

### PUT /notifications/:id/read
Mark a notification as read
**Response**:
```javascript
{
  data: {
    _id: 'notification-id',
    read: true
  }
}
```

### PUT /notifications/mark-all-read
Mark all notifications as read for current user
**Response**:
```javascript
{
  data: {
    modifiedCount: 10
  }
}
```

### DELETE /notifications/:id
Delete a notification
**Response**:
```javascript
{
  data: {
    deleted: true
  }
}
```

## Notification Model Schema

Recommended MongoDB schema:

```javascript
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'project_added',
      'project_removed',
      'project_updated',
      'task_assigned',
      'task_updated',
      'task_completed',
      'task_comment',
      'member_joined',
      'member_left',
      'deadline_approaching',
      'mention'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: Object // Store additional data like actor names, etc.
  }
}, {
  timestamps: true // Creates createdAt and updatedAt
});

// Index for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
```

## Helper Function Example

```javascript
// Backend utility to create notifications
const createNotification = async (userId, type, message, description, projectId, taskId, metadata) => {
  const notification = await Notification.create({
    userId,
    type,
    message,
    description,
    projectId,
    taskId,
    metadata,
    read: false
  });
  
  // Optional: Send real-time notification via WebSocket/Socket.io
  // io.to(userId).emit('new-notification', notification);
  
  return notification;
};

// Example usage when assigning a task
const assignTask = async (taskId, userId, assignedBy) => {
  const task = await Task.findById(taskId).populate('project');
  const assigningUser = await User.findById(assignedBy);
  
  // Update task
  task.assignedTo = userId;
  await task.save();
  
  // Create notification
  await createNotification(
    userId,
    'task_assigned',
    `New task assigned: "${task.title}"`,
    `${assigningUser.fullname} assigned you a task in ${task.project.name}`,
    task.project._id,
    task._id,
    {
      taskTitle: task.title,
      projectName: task.project.name,
      actorName: assigningUser.fullname
    }
  );
};
```

## Frontend Polling

The frontend automatically polls for new notifications every 30 seconds using:
- `GET /notifications/unread-count` - To update badge count

For real-time notifications, consider implementing WebSocket/Socket.io for instant delivery.

## Testing

Use the test notification generator in the Settings page to see how notifications appear in the UI before implementing backend.
