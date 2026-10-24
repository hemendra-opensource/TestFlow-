import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export const listProjects = async (scopedSupabase, workspaceId, filters = {}) => {
  let query = scopedSupabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data: projects, error } = await query;

  if (error) {
    logger.error('Failed to list projects', error);
    throw new AppError('Failed to fetch projects', 500);
  }

  // Load task stats for each project in this workspace
  const { data: tasks, error: tasksError } = await scopedSupabase
    .from('tasks')
    .select('id, project_id, status');

  const statsMap = {};
  if (!tasksError && Array.isArray(tasks)) {
    for (const t of tasks) {
      if (!statsMap[t.project_id]) {
        statsMap[t.project_id] = { total: 0, completed: 0 };
      }
      statsMap[t.project_id].total += 1;
      if (t.status === 'done') {
        statsMap[t.project_id].completed += 1;
      }
    }
  }

  let result = projects.map((p) => {
    const stats = statsMap[p.id] || { total: 0, completed: 0 };
    const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    return {
      ...p,
      total_tasks: stats.total,
      completed_tasks: stats.completed,
      progress,
    };
  });

  if (filters.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  return result;
};

export const createProject = async (scopedSupabase, workspaceId, userId, data) => {
  const payload = {
    workspace_id: workspaceId,
    name: data.name,
    description: data.description || null,
    status: data.status || 'active',
    start_date: data.start_date || null,
    due_date: data.due_date || null,
    created_by: userId,
    archived_at: data.status === 'archived' ? new Date().toISOString() : null,
  };

  const { data: project, error } = await scopedSupabase
    .from('projects')
    .insert(payload)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create project', error);
    throw new AppError('Failed to create project', 500);
  }

  return {
    ...project,
    total_tasks: 0,
    completed_tasks: 0,
    progress: 0,
  };
};

export const getProjectById = async (scopedSupabase, projectId) => {
  const { data: project, error } = await scopedSupabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error || !project) {
    logger.error('Failed to get project', error);
    throw new AppError('Project not found or access denied', 404);
  }

  // Get task stats
  const { data: tasks } = await scopedSupabase
    .from('tasks')
    .select('id, status')
    .eq('project_id', projectId);

  const total = tasks?.length || 0;
  const completed = tasks?.filter((t) => t.status === 'done').length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    ...project,
    total_tasks: total,
    completed_tasks: completed,
    progress,
  };
};

export const updateProject = async (scopedSupabase, projectId, data) => {
  const updates = { ...data };

  if (updates.status === 'archived') {
    updates.archived_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'archived') {
    updates.archived_at = null;
  }

  const { data: updated, error } = await scopedSupabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update project', error);
    throw new AppError('Failed to update project', 500);
  }

  return getProjectById(scopedSupabase, projectId);
};

export const deleteProject = async (scopedSupabase, projectId) => {
  const { error } = await scopedSupabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    logger.error('Failed to delete project', error);
    throw new AppError('Failed to delete project', 500);
  }

  return { id: projectId, deleted: true };
};
