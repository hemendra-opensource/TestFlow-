/**
 * Consistent JSON response helper for successful operations
 */
export const successResponse = (res, data = null, statusCode = 200, message = null) => {
  const payload = {
    success: true,
    data,
  };
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Consistent JSON response helper for error states
 */
export const errorResponse = (res, message, statusCode = 500, details = null) => {
  const payload = {
    success: false,
    error: {
      message: message || 'An unexpected error occurred',
    },
  };
  if (details) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
};
