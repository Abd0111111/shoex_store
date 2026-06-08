const multer = require("multer");
const { sendError } = require("../utils/response");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File size cannot exceed 5MB", "VALIDATION_ERROR", 422);
    }
    return sendError(res, err.message, "VALIDATION_ERROR", 422);
  }

  if (err) {
    return sendError(res, err.message, "VALIDATION_ERROR", 422);
  }

  next();
};

module.exports = { upload, handleUploadError };