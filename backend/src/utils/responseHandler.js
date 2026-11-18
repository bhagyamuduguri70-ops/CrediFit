export function sendResponse(res, statusCode, success, message, data = null) {
  const payload = {
    success,
    message,
    ...(data !== null && data !== undefined ? { data } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendSuccess(res, message, data = null, statusCode = 200) {
  return sendResponse(res, statusCode, true, message, data);
}

export function sendError(res, message, statusCode = 400, data = null) {
  return sendResponse(res, statusCode, false, message, data);
}

export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
