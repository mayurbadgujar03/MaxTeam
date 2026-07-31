import multer from "multer";

// Only PDF uploads are allowed
const ALLOWED_MIME_TYPES = ["application/pdf"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new Error(
        "Unsupported file type. Only PDF files are allowed.",
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
