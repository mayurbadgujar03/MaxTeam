export const NotificationType = {
  PROJECT_ADDED: 'project_added',
  PROJECT_REMOVED: 'project_removed',
  PROJECT_UPDATED: 'project_updated',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENT: 'task_comment',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  MEMBER_REMOVED: 'member_removed',
  DEADLINE_APPROACHING: 'deadline_approaching',
  MENTION: 'mention',
};

export const createProjectAddedNotification = (projectName, addedBy) => ({
  type: 'project',
  message: `You were added to "${projectName}"`,
  description: `${addedBy} added you as a team member`,
  read: false,
});

export const createTaskAssignedNotification = (taskTitle, projectName, assignedBy) => ({
  type: 'task',
  message: `New task assigned: "${taskTitle}"`,
  description: `${assignedBy} assigned you a task in ${projectName}`,
  read: false,
});

export const createTaskUpdatedNotification = (taskTitle, projectName, updatedBy, change) => ({
  type: 'task',
  message: `Task updated: "${taskTitle}"`,
  description: `${updatedBy} ${change} in ${projectName}`,
  read: false,
});

export const createTaskCompletedNotification = (taskTitle, projectName, completedBy) => ({
  type: 'task',
  message: `Task completed: "${taskTitle}"`,
  description: `${completedBy} marked the task as done in ${projectName}`,
  read: false,
});

export const createMemberJoinedNotification = (memberName, projectName) => ({
  type: 'member',
  message: `${memberName} joined your project`,
  description: `${projectName} has a new team member`,
  read: false,
});

export const createDeadlineNotification = (taskTitle, projectName, timeRemaining) => ({
  type: 'task',
  message: `Deadline approaching: "${taskTitle}"`,
  description: `Due ${timeRemaining} in ${projectName}`,
  read: false,
});

export const createMentionNotification = (mentionedBy, context, location) => ({
  type: 'default',
  message: `${mentionedBy} mentioned you`,
  description: `"${context}" in ${location}`,
  read: false,
});

export const getNotificationCategory = (type) => {
  const categoryMap = {
    project_added: 'project',
    project_removed: 'project',
    project_updated: 'project',
    task_assigned: 'task',
    task_updated: 'task',
    task_completed: 'task',
    task_comment: 'task',
    member_joined: 'member',
    member_left: 'member',
    member_removed: 'member',
    deadline_approaching: 'task',
    mention: 'default',
  };
  return categoryMap[type] || 'default';
};
