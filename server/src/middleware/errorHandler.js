import { AppError } from '../utils/appError.js';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(err.message || 'Unhandled error', err);

  // If response has already started sending
  if (res.headersSent) {
    return next(err);
  }

  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON in request body', 400);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.details);
  }

  // Handle common Postgres / Supabase error codes
  if (err.code === '23505') {
    return errorResponse(res, 'A resource with this identifier or slug already exists', 409);
  }
  if (err.code === '42501') {
    return errorResponse(res, 'Permission denied', 403);
  }
  if (err.code === 'PGRST116') {
    return errorResponse(res, 'Requested resource was not found', 404);
  }

  // Production vs Development fallback
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'Internal server error';

  return errorResponse(res, message, 500);
};
