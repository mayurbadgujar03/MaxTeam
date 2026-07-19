import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Project } from "../models/project.models.js";
import { AvailableDocumentFileTypes } from "../utils/constants.js";

// Valid document slots on the Project schema (documents.report / documents.presentation)
const VALID_DOC_TYPES = ["report", "presentation"];

// Map allowed MIME types to our document file-type enum so we can derive the extension
const MIME_TYPE_MAP = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

// Lazily build a single R2-backed S3 client from environment credentials
let r2Client = null;
const getR2Client = () => {
  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
      },
    });
  }
  return r2Client;
};

const uploadProjectDocument = asyncHandler(async (req, res) => {
  const { projectId, docType } = req.params;

  if (!VALID_DOC_TYPES.includes(docType)) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          `Invalid document type. Must be one of: ${VALID_DOC_TYPES.join(", ")}`,
        ),
      );
  }

  if (!req.file) {
    return res.status(400).json(new ApiError(400, "No file uploaded"));
  }

  const fileType = MIME_TYPE_MAP[req.file.mimetype];

  if (!fileType || !AvailableDocumentFileTypes.includes(fileType)) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          `Unsupported file type. Allowed types: ${AvailableDocumentFileTypes.join(", ")}`,
        ),
      );
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  if (project.documents?.[docType]?.isLocked) {
    return res
      .status(403)
      .json(new ApiError(403, "This document is locked and cannot be replaced"));
  }

  const ext = fileType;
  const key = `projects/${projectId}/${docType}-${Date.now()}.${ext}`;

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }),
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}${key}`;

  project.documents[docType] = {
    ...(project.documents[docType]?.toObject?.() ?? project.documents[docType]),
    url: publicUrl,
    fileName: req.file.originalname,
    fileType,
    uploadedAt: new Date(),
    uploadedBy: req.user._id,
  };

  await project.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        project.documents[docType],
        "Document uploaded successfully",
      ),
    );
});

const deleteProjectDocument = asyncHandler(async (req, res) => {
  const { projectId, docType } = req.params;

  if (!VALID_DOC_TYPES.includes(docType)) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          `Invalid document type. Must be one of: ${VALID_DOC_TYPES.join(", ")}`,
        ),
      );
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  const document = project.documents?.[docType];

  if (!document || !document.url) {
    return res.status(404).json(new ApiError(404, "No document to delete"));
  }

  if (document.isLocked) {
    return res
      .status(403)
      .json(new ApiError(403, "This document is locked and cannot be deleted"));
  }

  // Derive the storage key from the public URL (R2_PUBLIC_URL + key)
  const key = document.url.replace(process.env.R2_PUBLIC_URL, "");

  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
  );

  project.documents[docType] = {
    url: null,
    fileName: null,
    fileType: null,
    uploadedAt: null,
    uploadedBy: null,
    isLocked: false,
  };

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Document deleted successfully"));
});

export { uploadProjectDocument, deleteProjectDocument };
