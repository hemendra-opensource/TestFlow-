import { getSupabaseAdminClient } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/appError.js';

/**
 * Strips sensitive keys (passwords, tokens, credentials) from metadata before persisting.
 */
const sanitizeMetadata = (meta = {}) => {
  if (!meta || typeof meta !== 'object') return {};
  const sanitized = { ...meta };
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'access_token',
    'refresh_token',
    'authorization',
    'credential',
  ];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      delete sanitized[key];
    }
  }
  return sanitized;
};

/**
 * Trusted server-side activity logger.
 * Never throws an error that interrupts primary operations.
 */
export const logActivity = async ({
  workspaceId,
  actorId = null,
  entityType,
  entityId,
  action,
  metadata = {},
}) => {
  try {
    if (!workspaceId || !entityType || !entityId || !action) {
      return;
    }

    const admin = getSupabaseAdminClient();
    const cleanMeta = sanitizeMetadata(metadata);

    const { error } = await admin.from('activity_logs').insert({
      workspace_id: workspaceId,
      actor_id: actorId,
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata: cleanMeta,
    });

    if (error) {
      logger.warn('Failed to insert activity log', { error: error.message });
    }
  } catch (err) {
    logger.warn('Unexpected error in logActivity', { error: err.message });
  }
};

/**
 * Lists recent activity logs for a workspace. Enforces workspace authorization through scopedSupabase.
 */
export const listWorkspaceActivity = async (scopedSupabase, workspaceId, options = {}) => {
  const limit = Math.min(Math.max(parseInt(options.limit || '50', 10), 1), 100);
  const offset = Math.max(parseInt(options.offset || '0', 10), 0);

  const { data: logs, error } = await scopedSupabase
    .from('activity_logs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to fetch workspace activity logs', error);
    throw new AppError('Failed to fetch workspace activity', 500);
  }

  const rawLogs = logs || [];
  const actorIds = Array.from(new Set(rawLogs.map((l) => l.actor_id).filter(Boolean)));
  let profileMap = new Map();

  if (actorIds.length > 0) {
    const { data: profiles, error: profError } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', actorIds);

    if (!profError && profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]));
    }
  }

  return rawLogs.map((log) => ({
    ...log,
    actor: log.actor_id ? profileMap.get(log.actor_id) || null : null,
  }));
};
