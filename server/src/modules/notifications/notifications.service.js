import { getSupabaseAdminClient } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/appError.js';

/**
 * Creates a notification from trusted server-side business operations.
 * - Prevents self-notification (actor === recipient).
 * - Verifies recipient belongs to the workspace.
 * - Deduplicates recent identical notifications.
 * - Never fails the calling operation.
 */
export const createNotification = async ({
  recipient_id,
  workspace_id = null,
  actor_id = null,
  type,
  title,
  message = null,
  entity_type = null,
  entity_id = null,
}) => {
  try {
    if (!recipient_id || !type || !title) return null;

    // Do not notify actor about their own actions
    if (actor_id && actor_id === recipient_id) {
      return null;
    }

    const admin = getSupabaseAdminClient();

    // Verify recipient belongs to the workspace if workspace_id provided
    if (workspace_id) {
      const { data: member, error: memberError } = await admin
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', workspace_id)
        .eq('user_id', recipient_id)
        .maybeSingle();

      if (memberError || !member) {
        logger.warn('Skipping notification: recipient is not in workspace', {
          recipient_id,
          workspace_id,
        });
        return null;
      }
    }

    // Deduplication check: avoid identical notifications within 10 seconds
    if (entity_id) {
      const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
      const { data: recentDuplicates } = await admin
        .from('notifications')
        .select('id')
        .eq('recipient_id', recipient_id)
        .eq('type', type)
        .eq('entity_id', entity_id)
        .gte('created_at', tenSecondsAgo)
        .limit(1);

      if (recentDuplicates && recentDuplicates.length > 0) {
        return null;
      }
    }

    const { data: notification, error } = await admin
      .from('notifications')
      .insert({
        recipient_id,
        workspace_id,
        actor_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      logger.warn('Failed to insert notification', { error: error.message });
      return null;
    }

    return notification;
  } catch (err) {
    logger.warn('Unexpected error creating notification', { error: err.message });
    return null;
  }
};

/**
 * Lists notifications for the authenticated recipient with pagination and optional filter.
 */
async function enrichNotificationsWithProfiles(scopedSupabase, notifications) {
  const list = Array.isArray(notifications) ? notifications : [notifications].filter(Boolean);
  if (list.length === 0) return Array.isArray(notifications) ? [] : null;

  const actorIds = Array.from(new Set(list.map((n) => n.actor_id).filter(Boolean)));
  let profileMap = new Map();

  if (actorIds.length > 0) {
    const { data: profiles, error } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', actorIds);

    if (!error && profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = list.map((n) => ({
    ...n,
    actor: n.actor_id ? profileMap.get(n.actor_id) || null : null,
  }));

  return Array.isArray(notifications) ? enriched : enriched[0] || null;
}

/**
 * Lists notifications for the authenticated recipient with pagination and optional filter.
 */
export const listNotifications = async (scopedSupabase, userId, options = {}) => {
  const limit = Math.min(Math.max(parseInt(options.limit || '20', 10), 1), 50);
  const offset = Math.max(parseInt(options.offset || '0', 10), 0);

  let query = scopedSupabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (options.is_read !== undefined && options.is_read !== null) {
    const isReadBool = options.is_read === 'true' || options.is_read === true;
    query = query.eq('is_read', isReadBool);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: notifications, error } = await query;

  if (error) {
    logger.error('Failed to list notifications', error);
    throw new AppError('Failed to fetch notifications', 500);
  }

  return enrichNotificationsWithProfiles(scopedSupabase, notifications || []);
};

/**
 * Counts unread notifications for the user.
 */
export const getUnreadCount = async (scopedSupabase, userId) => {
  const { data, count, error } = await scopedSupabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    logger.error('Failed to get unread notification count', error);
    throw new AppError('Failed to fetch unread count', 500);
  }

  const unreadCount = count !== null && count !== undefined ? count : (data ? data.length : 0);
  return { unread_count: unreadCount };
};

/**
 * Marks a single notification as read, ensuring it belongs to the authenticated user.
 */
export const markNotificationAsRead = async (scopedSupabase, notificationId, userId) => {
  const now = new Date().toISOString();

  const { data: updated, error } = await scopedSupabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
    })
    .eq('id', notificationId)
    .eq('recipient_id', userId)
    .select('*')
    .maybeSingle();

  if (error) {
    logger.error('Failed to mark notification as read', error);
    throw new AppError('Failed to update notification', 500);
  }

  if (!updated) {
    throw new AppError('Notification not found or access denied', 404);
  }

  return enrichNotificationsWithProfiles(scopedSupabase, updated);
};

/**
 * Marks all unread notifications as read for the authenticated user.
 */
export const markAllNotificationsAsRead = async (scopedSupabase, userId) => {
  const now = new Date().toISOString();

  const { data: updated, error } = await scopedSupabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: now,
    })
    .eq('recipient_id', userId)
    .eq('is_read', false)
    .select('id');

  if (error) {
    logger.error('Failed to mark all notifications as read', error);
    throw new AppError('Failed to mark all notifications as read', 500);
  }

  return { marked_count: updated ? updated.length : 0 };
};
