import { getSupabaseClient, createScopedClient } from '../config/supabase.js';
import { errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * Authentication middleware that verifies the Supabase access token via supabase.auth.getUser()
 * and configures a user-scoped Supabase client for Row Level Security (RLS) enforcement.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token is missing or malformed', 401);
    }

    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      return errorResponse(res, 'Authentication token is required', 401);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      logger.warn('Token verification failed', { error: error?.message });
      return errorResponse(res, 'Invalid or expired authentication token', 401);
    }

    // Attach user and scoped client to request
    req.user = data.user;
    req.accessToken = token;
    req.scopedSupabase = createScopedClient(token);

    next();
  } catch (err) {
    logger.error('Unexpected error in auth middleware', err);
    return errorResponse(res, 'Authentication verification failed', 500);
  }
};
