import multer from "multer";
import { AvailableDocumentFileTypes } from "../utils/constants.js";

// Map allowed MIME types to our document file-type enum (pdf, doc, docx, ppt, pptx)
const MIME_TYPE_MAP = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  const mappedType = MIME_TYPE_MAP[file.mimetype];

  if (!mappedType || !AvailableDocumentFileTypes.includes(mappedType)) {
    return cb(
      new Error(
        `Unsupported file type. Allowed types: ${AvailableDocumentFileTypes.join(", ")}`,
      ),
      false,
    );
  }

  cb(null, true);
};

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});
