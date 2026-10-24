import { ZodError } from 'zod';
import { errorResponse } from '../utils/response.js';

/**
 * Middleware factory for validating request parts (body, query, params) with Zod
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError || err.name === 'ZodError') {
        const errors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return errorResponse(res, 'Validation error', 400, errors);
      }
      next(err);
    }
  };
};
