import { sendError } from "../utils/responseHandler.js";

export function notFoundHandler(req, res) {
  return sendError(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
}

export function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File size limit exceeded. Maximum file size is 5MB.", 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }

  if (err.code === "ER_DUP_ENTRY") {
    return sendError(res, "A record with this unique value already exists.", 409);
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    return sendError(res, "Invalid reference identifier. Related parent record does not exist.", 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "An internal server error occurred.";
  return sendError(res, message, statusCode);
}
