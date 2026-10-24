import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export const listTasks = async (scopedSupabase, projectId, filters = {}) => {
  let query = scopedSupabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url)
    `)
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

  let result = tasks || [];

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
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    logger.error('Failed to create task', error);
    throw new AppError('Failed to create task', 500);
  }

  return created;
};

export const getTaskById = async (scopedSupabase, taskId) => {
  const { data: task, error } = await scopedSupabase
    .from('tasks')
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url)
    `)
    .eq('id', taskId)
    .maybeSingle();

  if (error || !task) {
    logger.error('Failed to get task', error);
    throw new AppError('Task not found or access denied', 404);
  }

  return task;
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
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url)
    `)
    .single();

  if (error) {
    logger.error('Failed to update task', error);
    throw new AppError('Failed to update task', 500);
  }

  return updated;
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
