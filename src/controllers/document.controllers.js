import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { Project } from "../models/project.models.js";

// Valid document slots on the Project schema (documents.report / documents.presentation)
const VALID_DOC_TYPES = ["report", "presentation"];

// Maximum number of versions to retain per document slot
const MAX_VERSIONS = 3;

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

/**
 * Derive the R2 storage key from a public URL.
 * The key is everything after the R2_PUBLIC_URL prefix.
 */
const getR2KeyFromUrl = (url) => url.replace(process.env.R2_PUBLIC_URL, "");

/**
 * Delete a single object from R2 by its storage key.
 */
const deleteR2Object = async (key) => {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
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

  if (req.file.mimetype !== "application/pdf") {
    return res
      .status(400)
      .json(new ApiError(400, "Only PDF files are allowed."));
  }

  const project = await Project.findById(projectId);

  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  // ── Upload new file to Cloudflare R2 ──────────────────────────────────
  const key = `projects/${projectId}/${docType}-${Date.now()}.pdf`;
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

  // ── Push new version into the versions array ──────────────────────────
  const newVersion = {
    url: publicUrl,
    fileName: req.file.originalname,
    fileType: "pdf",
    fileSize: req.file.size,
    uploadedAt: new Date(),
    uploadedBy: req.user._id,
  };

  // Ensure the array exists (first-time upload on a pre-existing project)
  if (!project.documents[docType]) {
    project.documents[docType] = [];
  }

  project.documents[docType].push(newVersion);

  // ── 3-Tier Auto-Delete: prune oldest version when exceeding MAX_VERSIONS ─
  if (project.documents[docType].length > MAX_VERSIONS) {
    const oldest = project.documents[docType][0];

    // Delete the oldest file from Cloudflare R2
    if (oldest?.url) {
      try {
        const oldKey = getR2KeyFromUrl(oldest.url);
        await deleteR2Object(oldKey);
      } catch (err) {
        // Log but don't block the upload – the metadata will still be pruned
        console.error(
          `[DocumentHub] Failed to delete oldest R2 object for ${docType}:`,
          err.message,
        );
      }
    }

    // Remove the oldest entry from the array
    project.documents[docType].shift();
  }

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
  // Optional: versionIndex query param to delete a specific version
  const versionIndex = req.query.versionIndex != null
    ? parseInt(req.query.versionIndex, 10)
    : null;

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

  const versions = project.documents?.[docType];

  if (!versions || versions.length === 0) {
    return res.status(404).json(new ApiError(404, "No document to delete"));
  }

  // If a specific version index was provided, delete only that version
  if (versionIndex !== null) {
    if (versionIndex < 0 || versionIndex >= versions.length) {
      return res
        .status(400)
        .json(new ApiError(400, "Invalid version index"));
    }

    const target = versions[versionIndex];

    if (target.isLocked) {
      return res
        .status(403)
        .json(new ApiError(403, "This document version is locked and cannot be deleted"));
    }

    // Delete from R2
    if (target.url) {
      const key = getR2KeyFromUrl(target.url);
      await deleteR2Object(key);
    }

    // Remove from array
    project.documents[docType].splice(versionIndex, 1);
  } else {
    // Default: delete the latest (last) version
    const latest = versions[versions.length - 1];

    if (latest.isLocked) {
      return res
        .status(403)
        .json(new ApiError(403, "This document is locked and cannot be deleted"));
    }

    if (latest.url) {
      const key = getR2KeyFromUrl(latest.url);
      await deleteR2Object(key);
    }

    project.documents[docType].pop();
  }

  await project.save();

  return res
    .status(200)
    .json(new ApiResponse(200, project.documents[docType], "Document deleted successfully"));
});

export { uploadProjectDocument, deleteProjectDocument };
