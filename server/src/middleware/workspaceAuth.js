import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Role hierarchy for permission comparison.
 * Higher value = more privilege.
 */
const ROLE_LEVEL = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

/**
 * Middleware: loads caller's workspace membership from DB
 * and attaches it to req.workspaceMembership.
 * Always uses the scoped client (enforces RLS) so a non-member gets null data.
 */
export const requireWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!workspaceId || !/^[0-9a-f-]{36}$/i.test(workspaceId)) {
      return next(new AppError('Invalid workspace ID format', 400));
    }

    const { data: membership, error } = await req.scopedSupabase
      .from('workspace_members')
      .select('role, workspace_id, user_id, joined_at')
      .eq('workspace_id', workspaceId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to check workspace membership', error);
      return next(new AppError('Failed to verify workspace access', 500));
    }

    if (!membership) {
      // RLS hides records from non-members; treat as 404 to avoid information disclosure
      return next(new AppError('Workspace not found or access denied', 404));
    }

    req.workspaceMembership = membership;
    next();
  } catch (err) {
    logger.error('Unexpected error in workspace member check', err);
    next(err);
  }
};

/**
 * Middleware factory: requires caller to have at least the given role in the workspace.
 * Must be used AFTER requireWorkspaceMember, requireProjectMember, or requireTaskMember.
 *
 * @param {string} minimumRole - 'viewer' | 'member' | 'admin' | 'owner'
 */
export const requireWorkspaceRole = (minimumRole) => (req, res, next) => {
  const membership = req.workspaceMembership;
  if (!membership) {
    return next(new AppError('Workspace membership not loaded', 500));
  }

  const callerLevel = ROLE_LEVEL[membership.role] ?? 0;
  const requiredLevel = ROLE_LEVEL[minimumRole] ?? 999;

  if (callerLevel < requiredLevel) {
    return next(
      new AppError(
        `Insufficient permissions. Required role: ${minimumRole}. Your role: ${membership.role}`,
        403
      )
    );
  }

  next();
};

/**
 * Middleware: loads project and caller's workspace membership.
 * Attaches req.project and req.workspaceMembership.
 */
export const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId || !/^[0-9a-f-]{36}$/i.test(projectId)) {
      return next(new AppError('Invalid project ID format', 400));
    }

    // Fetch project with scoped client
    const { data: project, error: projError } = await req.scopedSupabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projError) {
      logger.error('Failed to check project access', projError);
      return next(new AppError('Failed to verify project access', 500));
    }

    if (!project) {
      return next(new AppError('Project not found or access denied', 404));
    }

    // Load workspace membership
    const { data: membership, error: memError } = await req.scopedSupabase
      .from('workspace_members')
      .select('role, workspace_id, user_id, joined_at')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (memError || !membership) {
      return next(new AppError('Project not found or access denied', 404));
    }

    req.project = project;
    req.workspaceMembership = membership;
    next();
  } catch (err) {
    logger.error('Unexpected error in project member check', err);
    next(err);
  }
};

/**
 * Middleware: loads task, its parent project, and caller's workspace membership.
 * Attaches req.task, req.project, and req.workspaceMembership.
 */
export const requireTaskMember = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!taskId || !/^[0-9a-f-]{36}$/i.test(taskId)) {
      return next(new AppError('Invalid task ID format', 400));
    }

    const { data: task, error: taskError } = await req.scopedSupabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (taskError) {
      logger.error('Failed to check task access', taskError);
      return next(new AppError('Failed to verify task access', 500));
    }

    if (!task) {
      return next(new AppError('Task not found or access denied', 404));
    }

    const { data: project, error: projError } = await req.scopedSupabase
      .from('projects')
      .select('*')
      .eq('id', task.project_id)
      .maybeSingle();

    if (projError || !project) {
      return next(new AppError('Task not found or access denied', 404));
    }

    const { data: membership, error: memError } = await req.scopedSupabase
      .from('workspace_members')
      .select('role, workspace_id, user_id, joined_at')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (memError || !membership) {
      return next(new AppError('Task not found or access denied', 404));
    }

    req.task = task;
    req.project = project;
    req.workspaceMembership = membership;
    next();
  } catch (err) {
    logger.error('Unexpected error in task member check', err);
    next(err);
  }
};

/**
 * Middleware: ensures caller has permission to delete a task.
 * Permitted if: role is owner/admin OR (role is member AND caller is task creator).
 */
export const requireTaskDeletePermission = (req, res, next) => {
  const membership = req.workspaceMembership;
  const task = req.task;

  if (!membership || !task) {
    return next(new AppError('Task or workspace membership not loaded', 500));
  }

  const isOwnerOrAdmin = ['owner', 'admin'].includes(membership.role);
  const isCreatorMember = membership.role === 'member' && task.created_by === req.user.id;

  if (!isOwnerOrAdmin && !isCreatorMember) {
    return next(
      new AppError(
        'Insufficient permissions to delete this task. Requires owner/admin or task author.',
        403
      )
    );
  }

  next();
};

/**
 * Middleware: loads comment, its task, parent project, and caller's workspace membership.
 * Attaches req.comment, req.task, req.project, and req.workspaceMembership.
 */
export const requireCommentMember = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!commentId || !/^[0-9a-f-]{36}$/i.test(commentId)) {
      return next(new AppError('Invalid comment ID format', 400));
    }

    const { data: comment, error: commentError } = await req.scopedSupabase
      .from('task_comments')
      .select('*')
      .eq('id', commentId)
      .maybeSingle();

    if (commentError) {
      logger.error('Failed to check comment access', commentError);
      return next(new AppError('Failed to verify comment access', 500));
    }

    if (!comment) {
      return next(new AppError('Comment not found or access denied', 404));
    }

    const { data: task, error: taskError } = await req.scopedSupabase
      .from('tasks')
      .select('*')
      .eq('id', comment.task_id)
      .maybeSingle();

    if (taskError || !task) {
      return next(new AppError('Comment not found or access denied', 404));
    }

    const { data: project, error: projError } = await req.scopedSupabase
      .from('projects')
      .select('*')
      .eq('id', task.project_id)
      .maybeSingle();

    if (projError || !project) {
      return next(new AppError('Comment not found or access denied', 404));
    }

    const { data: membership, error: memError } = await req.scopedSupabase
      .from('workspace_members')
      .select('role, workspace_id, user_id, joined_at')
      .eq('workspace_id', project.workspace_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (memError || !membership) {
      return next(new AppError('Comment not found or access denied', 404));
    }

    req.comment = comment;
    req.task = task;
    req.project = project;
    req.workspaceMembership = membership;
    next();
  } catch (err) {
    logger.error('Unexpected error in comment member check', err);
    next(err);
  }
};

/**
 * Middleware: ensures caller is the author of the comment (for edits).
 */
export const requireCommentAuthor = (req, res, next) => {
  const comment = req.comment;
  if (!comment) {
    return next(new AppError('Comment not loaded', 500));
  }

  if (comment.author_id !== req.user.id) {
    return next(new AppError('You can only edit your own comments', 403));
  }

  next();
};

/**
 * Middleware: ensures caller has permission to delete a comment.
 * Permitted if: author of the comment OR workspace owner/admin.
 */
export const requireCommentDeletePermission = (req, res, next) => {
  const comment = req.comment;
  const membership = req.workspaceMembership;

  if (!comment || !membership) {
    return next(new AppError('Comment or workspace membership not loaded', 500));
  }

  const isOwnerOrAdmin = ['owner', 'admin'].includes(membership.role);
  const isAuthor = comment.author_id === req.user.id;

  if (!isOwnerOrAdmin && !isAuthor) {
    return next(
      new AppError(
        'Insufficient permissions to delete this comment. Requires owner/admin or comment author.',
        403
      )
    );
  }

  next();
};
