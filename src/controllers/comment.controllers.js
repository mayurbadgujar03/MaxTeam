import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Comment } from "../models/comment.models.js";
import { Notification } from "../models/notification.models.js";

const addDocumentComment = asyncHandler(async (req, res) => {
  const { content, pageNumber, documentId, projectId, entityType, mentions = [] } = req.body;

  if (!content || !documentId || !projectId) {
    return res
      .status(400)
      .json(new ApiError(400, "content, documentId, and projectId are required"));
  }

  const comment = await Comment.create({
    project: projectId,
    author: req.user._id,
    entityType: entityType || "report",
    entityId: documentId,
    content,
    pageNumber: pageNumber || null,
    mentions,
  });

  if (mentions && mentions.length > 0) {
    const notifications = mentions.map((userId) => ({
      userId,
      type: "comment_mention",
      message: `${req.user.name || req.user.fullname || "Someone"} mentioned you in a comment.`,
      description: content.substring(0, 50) + (content.length > 50 ? "..." : ""),
      projectId: projectId,
    }));
    await Notification.insertMany(notifications);
  }

  await comment.populate("author", "fullname username avatar");

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const getDocumentComments = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const docId = documentId || req.query.documentId;

  if (!docId) {
    return res.status(400).json(new ApiError(400, "documentId is required"));
  }

  const comments = await Comment.find({ entityId: docId })
    .populate("author", "fullname username avatar")
    .sort({ createdAt: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

export { addDocumentComment, getDocumentComments };
