import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

async function enrichTasksWithProfiles(scopedSupabase, tasks) {
  const taskList = Array.isArray(tasks) ? tasks : [tasks].filter(Boolean);
  if (taskList.length === 0) return Array.isArray(tasks) ? [] : null;

  const userIds = Array.from(
    new Set(taskList.flatMap((t) => [t.assignee_id, t.created_by]).filter(Boolean))
  );

  let profileMap = new Map();
  if (userIds.length > 0) {
    const { data: profiles, error } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (!error && profiles) {
      profileMap = new Map(profiles.map((p) => [p.id, p]));
    }
  }

  const enriched = taskList.map((t) => ({
    ...t,
    assignee: t.assignee_id ? profileMap.get(t.assignee_id) || null : null,
    creator: t.created_by ? profileMap.get(t.created_by) || null : null,
  }));

  return Array.isArray(tasks) ? enriched : enriched[0] || null;
}

export const listTasks = async (scopedSupabase, projectId, filters = {}) => {
  let query = scopedSupabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId);

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }

  if (filters.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id);
  }

  // Handle sorting
  const sortBy = filters.sort_by || 'position';
  const ascending = filters.order === 'desc' ? false : true;

  if (['due_date', 'created_at', 'position', 'priority'].includes(sortBy)) {
    query = query.order(sortBy, { ascending, nullsFirst: false });
  } else {
    query = query.order('position', { ascending: true });
  }

  const { data: tasks, error } = await query;

  if (error) {
    logger.error('Failed to list tasks', error);
    throw new AppError('Failed to fetch tasks', 500);
  }

  let result = await enrichTasksWithProfiles(scopedSupabase, tasks || []);

  if (filters.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        (t.description && t.description.toLowerCase().includes(term))
    );
  }

  return result;
};

export const createTask = async (scopedSupabase, projectId, workspaceId, userId, data) => {
  // Enforce assignee workspace membership check
  if (data.assignee_id) {
    const { data: member, error: memberError } = await scopedSupabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', data.assignee_id)
      .maybeSingle();

    if (memberError || !member) {
      throw new AppError('Task assignee must belong to the workspace', 400);
    }
  }

  // Determine position if not set
  let position = data.position;
  if (position === undefined || position === null) {
    const { data: existingTasks } = await scopedSupabase
      .from('tasks')
      .select('position')
      .eq('project_id', projectId)
      .eq('status', data.status || 'todo')
      .order('position', { ascending: false })
      .limit(1);

    position = existingTasks && existingTasks.length > 0 ? (existingTasks[0].position || 0) + 1000 : 1000;
  }

  const payload = {
    project_id: projectId,
    title: data.title,
    description: data.description || null,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    assignee_id: data.assignee_id || null,
    due_date: data.due_date || null,
    position,
    created_by: userId,
  };

  const { data: created, error } = await scopedSupabase
    .from('tasks')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to create task', error);
    throw new AppError('Failed to create task', 500);
  }

  return enrichTasksWithProfiles(scopedSupabase, created);
};

export const getTaskById = async (scopedSupabase, taskId) => {
  const { data: task, error } = await scopedSupabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle();

  if (error || !task) {
    logger.error('Failed to get task', error);
    throw new AppError('Task not found or access denied', 404);
  }

  return enrichTasksWithProfiles(scopedSupabase, task);
};

export const updateTask = async (scopedSupabase, taskId, workspaceId, data) => {
  // If assignee is being updated to a non-null value, verify workspace membership
  if (data.assignee_id !== undefined && data.assignee_id !== null) {
    const { data: member, error: memberError } = await scopedSupabase
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', data.assignee_id)
      .maybeSingle();

    if (memberError || !member) {
      throw new AppError('Task assignee must belong to the workspace', 400);
    }
  }

  const { data: updated, error } = await scopedSupabase
    .from('tasks')
    .update(data)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) {
    logger.error('Failed to update task', error);
    throw new AppError('Failed to update task', 500);
  }

  return enrichTasksWithProfiles(scopedSupabase, updated);
};

export const deleteTask = async (scopedSupabase, taskId) => {
  const { error } = await scopedSupabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    logger.error('Failed to delete task', error);
    throw new AppError('Failed to delete task', 500);
  }

  return { id: taskId, deleted: true };
};
