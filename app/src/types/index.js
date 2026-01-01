/**
 * @typedef {Object} ApiResponse
 * @property {number} statusCode
 * @property {any} data
 * @property {string} message
 * 
 * @typedef {Object} ApiError
 * @property {number} statusCode
 * @property {string} message
 * 
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {string} username
 * @property {string} [fullname]
 * @property {string} [avatar]
 * @property {boolean} emailVerified
 * @property {string} createdAt
 * @property {string} updatedAt
 * 
 * @typedef {Object} AuthTokens
 * @property {string} accessToken
 * @property {string} [refreshToken]
 * 
 * @typedef {Object} Project
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {User} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {number} [memberCount]
 * 
 * @typedef {Object} ProjectMember
 * @property {string} id
 * @property {string} userId
 * @property {User} user
 * @property {string} projectId
 * @property {'owner'|'admin'|'member'|'viewer'} role
 * @property {string} createdAt
 * 
 * @typedef {'todo'|'in_progress'|'done'|'cancelled'} TaskStatus
 * 
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {TaskStatus} status
 * @property {string} projectId
 * @property {User} [assignedTo]
 * @property {User} [assignedBy]
 * @property {Array<{ _id: string, url: string, title?: string, siteName?: string, description?: string, image?: string }>} links
 * @property {Subtask[]} subtasks
 * @property {string} createdAt
 * @property {string} updatedAt
 * 
 * @typedef {Object} Subtask
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {string} taskId
 * @property {string} createdAt
 * @property {string} updatedAt
 * 
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {string} filename
 * @property {string} url
 * @property {number} size
 * @property {string} mimeType
 * @property {string} createdAt
 * 
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string} projectId
 * @property {User} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 * 
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} password
 * 
 * @typedef {Object} RegisterCredentials
 * @property {string} email
 * @property {string} username
 * @property {string} password
 * @property {string} [fullname]
 * 
 * @typedef {Object} CreateProjectInput
 * @property {string} name
 * @property {string} [description]
 * 
 * @typedef {Object} CreateTaskInput
 * @property {string} title
 * @property {string} [description]
 * @property {TaskStatus} [status]
 * @property {string} [assignedToId]
 * @property {string[]} [links] // Array of URL strings
 * 
 * @typedef {Object} CreateNoteInput
 * @property {string} title
 * @property {string} content
 * 
 * @typedef {Object} AddMemberInput
 * @property {string} email
 * @property {'admin'|'member'|'viewer'} role
 */

export {};
