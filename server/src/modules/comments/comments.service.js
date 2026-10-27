import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import { createNotification } from '../notifications/notifications.service.js';
import { logActivity } from '../activity/activity.service.js';

async function enrichCommentsWithProfiles(scopedSupabase, comments) {
  const list = Array.isArray(comments) ? comments : [comments].filter(Boolean);
  if (list.length === 0) return Array.isArray(comments) ? [] : null;

  const authorIds = Array.from(new Set(list.map((c) => c.author_id).filter(Boolean)));
  let profileMap = new Map();

  if (authorIds.length > 0) {
    const { data: profiles, error } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', authorIds);

    if (!error && profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = list.map((c) => ({
    ...c,
    author: c.author_id ? profileMap.get(c.author_id) || null : null,
  }));

  return Array.isArray(comments) ? enriched : enriched[0] || null;
}

/**
 * Lists all comments for a specific task in chronological order.
 */
export const listComments = async (scopedSupabase, taskId) => {
  const { data: comments, error } = await scopedSupabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Failed to list task comments', error);
    throw new AppError('Failed to fetch comments', 500);
  }

  return enrichCommentsWithProfiles(scopedSupabase, comments || []);
};

/**
 * Creates a comment on a task, logs activity, and notifies relevant members.
 */
export const createComment = async (
  scopedSupabase,
  taskId,
  user,
  task,
  workspaceId,
  content
) => {
  const { data: comment, error } = await scopedSupabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: user.id,
      content: content.trim(),
    })
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to create task comment', error);
    throw new AppError('Failed to create comment', 500);
  }

  const authorName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'A team member';

  // 1. Log workspace activity
  await logActivity({
    workspaceId,
    actorId: user.id,
    entityType: 'task',
    entityId: taskId,
    action: 'commented',
    metadata: {
      task_title: task?.title || 'Task',
      comment_id: comment.id,
    },
  });

  // 2. Notify assignee if different from author
  if (task?.assignee_id && task.assignee_id !== user.id) {
    await createNotification({
      recipient_id: task.assignee_id,
      workspace_id: workspaceId,
      actor_id: user.id,
      type: 'task_comment',
      title: 'New comment on assigned task',
      message: `${authorName} commented on "${task.title}": "${content.slice(0, 80)}${
        content.length > 80 ? '...' : ''
      }"`,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  // 3. Notify creator if different from author and different from assignee
  if (
    task?.created_by &&
    task.created_by !== user.id &&
    task.created_by !== task?.assignee_id
  ) {
    await createNotification({
      recipient_id: task.created_by,
      workspace_id: workspaceId,
      actor_id: user.id,
      type: 'task_comment',
      title: 'New comment on your task',
      message: `${authorName} commented on "${task.title}": "${content.slice(0, 80)}${
        content.length > 80 ? '...' : ''
      }"`,
      entity_type: 'task',
      entity_id: taskId,
    });
  }

  return enrichCommentsWithProfiles(scopedSupabase, comment);
};

/**
 * Updates a comment's content and sets edited_at timestamp.
 */
export const updateComment = async (scopedSupabase, commentId, content) => {
  const { data: updated, error } = await scopedSupabase
    .from('task_comments')
    .update({
      content: content.trim(),
      edited_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to update task comment', error);
    throw new AppError('Failed to update comment', 500);
  }

  return enrichCommentsWithProfiles(scopedSupabase, updated);
};

/**
 * Deletes a comment.
 */
export const deleteComment = async (
  scopedSupabase,
  commentId,
  workspaceId,
  actorId,
  taskId,
  taskTitle
) => {
  const { error } = await scopedSupabase
    .from('task_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    logger.error('Failed to delete task comment', error);
    throw new AppError('Failed to delete comment', 500);
  }

  // Log activity
  if (workspaceId && taskId) {
    await logActivity({
      workspaceId,
      actorId,
      entityType: 'task',
      entityId: taskId,
      action: 'deleted_comment',
      metadata: { task_title: taskTitle || 'Task' },
    });
  }

  return { id: commentId, deleted: true };
};
