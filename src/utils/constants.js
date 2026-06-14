export const UserRolesEnum = {
    ADMIN: "admin",
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
    CANCELLED: "cancelled",
}

export const AvailableTaskStatuses = Object.values(TaskStatusEnum);

export const NoteCategoryEnum = {
    GENERAL: "general",
    MEETING: "meeting",
    ARCHITECTURE: "architecture",
    TODO: "todo",
    DECISION: "decision",
};

export const AvailableNoteCategories = Object.values(NoteCategoryEnum);

export const SystemRolesEnum = {
    USER: "user",
    SUPERADMIN: "superadmin",
};

export const AvailableSystemRoles = Object.values(SystemRolesEnum);

export const FeedbackTypeEnum = {
    BUG: "Bug",
    FEATURE: "Feature",
    GENERAL: "General",
};

export const AvailableFeedbackTypes = Object.values(FeedbackTypeEnum);

export const FeedbackStatusEnum = {
    PENDING: "pending",
    RESOLVED: "resolved",
};

export const AvailableFeedbackStatuses = Object.values(FeedbackStatusEnum);