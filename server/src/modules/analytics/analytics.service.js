import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

/**
 * Resolves accessible workspace IDs for the user and verifies requested workspace access.
 */
export async function resolveAccessibleWorkspaces(userId, scopedSupabase, requestedWorkspaceId) {
  const { data: memberships, error } = await scopedSupabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to query user workspace memberships for analytics', error);
    throw new AppError('Failed to verify workspace access', 500);
  }

  const userMemberships = memberships || [];
  const accessibleWorkspaceIds = userMemberships.map((m) => m.workspace_id);

  if (requestedWorkspaceId) {
    if (!accessibleWorkspaceIds.includes(requestedWorkspaceId)) {
      throw new AppError('Workspace not found or access denied', 404);
    }
    return [requestedWorkspaceId];
  }

  return accessibleWorkspaceIds;
}

/**
 * Computes date boundaries based on datePreset or explicit dates.
 */
export function computeDateBoundaries(filters) {
  let { startDate, endDate, datePreset } = filters;
  const now = new Date();

  if (datePreset && datePreset !== 'all' && datePreset !== 'custom') {
    const days = datePreset === '7d' ? 7 : datePreset === '30d' ? 30 : 90;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    startDate = start.toISOString().split('T')[0];
    endDate = now.toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

/**
 * Fetches filtered projects and tasks for the user's permitted workspace scope.
 */
async function fetchFilteredProjectsAndTasks(userId, scopedSupabase, filters) {
  const workspaceIds = await resolveAccessibleWorkspaces(userId, scopedSupabase, filters.workspaceId);

  if (workspaceIds.length === 0) {
    return { projects: [], tasks: [], workspaceIds: [] };
  }

  // 1. Fetch accessible projects
  let projectQuery = scopedSupabase
    .from('projects')
    .select('id, workspace_id, name, description, status, start_date, due_date, created_at, updated_at')
    .in('workspace_id', workspaceIds);

  if (filters.projectId) {
    projectQuery = projectQuery.eq('id', filters.projectId);
  }

  const { data: projectsData, error: projError } = await projectQuery;
  if (projError) {
    logger.error('Failed to query projects for analytics', projError);
    throw new AppError('Failed to fetch analytics data', 500);
  }

  const projects = projectsData || [];
  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return { projects, tasks: [], workspaceIds };
  }

  // 2. Fetch accessible tasks
  let taskQuery = scopedSupabase
    .from('tasks')
    .select(`
      id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at
    `)
    .in('project_id', projectIds);

  if (filters.status) {
    taskQuery = taskQuery.eq('status', filters.status);
  }

  if (filters.priority) {
    taskQuery = taskQuery.eq('priority', filters.priority);
  }

  if (filters.assigneeId) {
    taskQuery = taskQuery.eq('assignee_id', filters.assigneeId);
  }

  const { startDate, endDate } = computeDateBoundaries(filters);
  const dateField = filters.dateField || 'created_at';

  if (startDate) {
    taskQuery = taskQuery.gte(dateField, `${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    taskQuery = taskQuery.lte(dateField, `${endDate}T23:59:59.999Z`);
  }

  const { data: tasksData, error: taskError } = await taskQuery;
  if (taskError) {
    logger.error('Failed to query tasks for analytics', taskError);
    throw new AppError('Failed to fetch analytics data', 500);
  }

  return { projects, tasks: tasksData || [], workspaceIds };
}

/**
 * Returns overall metrics summary.
 */
export async function getOverviewMetrics(userId, scopedSupabase, filters = {}) {
  const { projects, tasks } = await fetchFilteredProjectsAndTasks(userId, scopedSupabase, filters);
  const today = new Date().toISOString().split('T')[0];

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const completedProjects = projects.filter((p) => p.status === 'completed').length;

  const totalTasks = tasks.length;
  const tasksCompleted = tasks.filter((t) => t.status === 'done').length;
  const tasksInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const tasksInReview = tasks.filter((t) => t.status === 'in_review').length;
  const tasksPending = tasks.filter((t) => t.status !== 'done').length;
  const tasksOverdue = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && t.due_date < today
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return {
    total_projects: totalProjects,
    active_projects: activeProjects,
    completed_projects: completedProjects,
    total_tasks: totalTasks,
    tasks_completed: tasksCompleted,
    tasks_in_progress: tasksInProgress,
    tasks_in_review: tasksInReview,
    tasks_pending: tasksPending,
    tasks_overdue: tasksOverdue,
    completion_rate: completionRate,
  };
}

/**
 * Returns task status distribution counts and percentages.
 */
export async function getTaskStatusDistribution(userId, scopedSupabase, filters = {}) {
  const { tasks } = await fetchFilteredProjectsAndTasks(userId, scopedSupabase, filters);
  const total = tasks.length;

  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  return {
    total,
    counts: {
      todo,
      in_progress: inProgress,
      in_review: inReview,
      done,
    },
    percentages: {
      todo: total > 0 ? Math.round((todo / total) * 100) : 0,
      in_progress: total > 0 ? Math.round((inProgress / total) * 100) : 0,
      in_review: total > 0 ? Math.round((inReview / total) * 100) : 0,
      done: total > 0 ? Math.round((done / total) * 100) : 0,
    },
  };
}

/**
 * Returns task priority distribution counts and percentages.
 */
export async function getPriorityDistribution(userId, scopedSupabase, filters = {}) {
  const { tasks } = await fetchFilteredProjectsAndTasks(userId, scopedSupabase, filters);
  const total = tasks.length;

  const low = tasks.filter((t) => t.priority === 'low').length;
  const medium = tasks.filter((t) => t.priority === 'medium').length;
  const high = tasks.filter((t) => t.priority === 'high').length;
  const urgent = tasks.filter((t) => t.priority === 'urgent').length;

  return {
    total,
    counts: {
      low,
      medium,
      high,
      urgent,
    },
    percentages: {
      low: total > 0 ? Math.round((low / total) * 100) : 0,
      medium: total > 0 ? Math.round((medium / total) * 100) : 0,
      high: total > 0 ? Math.round((high / total) * 100) : 0,
      urgent: total > 0 ? Math.round((urgent / total) * 100) : 0,
    },
  };
}

/**
 * Returns team workload distribution across members in the permitted workspace scope.
 */
export async function getWorkloadAnalytics(userId, scopedSupabase, filters = {}) {
  const { tasks, workspaceIds } = await fetchFilteredProjectsAndTasks(userId, scopedSupabase, filters);

  if (workspaceIds.length === 0) {
    return { members: [], unassigned_count: 0 };
  }

  // Fetch all members of the permitted workspaces
  const { data: membersData, error: memError } = await scopedSupabase
    .from('workspace_members')
    .select('user_id, role, workspace_id')
    .in('workspace_id', workspaceIds);

  if (memError) {
    logger.error('Failed to query workspace members for workload', memError);
    throw new AppError('Failed to fetch workload analytics', 500);
  }

  const memberUserIds = Array.from(new Set((membersData || []).map((m) => m.user_id)));

  // Fetch profiles for these users
  let profiles = [];
  if (memberUserIds.length > 0) {
    const { data: profData } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', memberUserIds);
    profiles = profData || [];
  }

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const today = new Date().toISOString().split('T')[0];

  const membersWorkload = memberUserIds.map((memberId) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === memberId);
    const prof = profileMap.get(memberId);
    const completed = memberTasks.filter((t) => t.status === 'done').length;
    const inProgress = memberTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = memberTasks.filter(
      (t) => t.status !== 'done' && t.due_date && t.due_date < today
    ).length;

    return {
      user_id: memberId,
      name: prof?.full_name || 'Team Member',
      avatar_url: prof?.avatar_url || null,
      total_assigned: memberTasks.length,
      in_progress: inProgress,
      completed,
      overdue,
    };
  });

  const unassignedTasks = tasks.filter((t) => !t.assignee_id);

  return {
    members: membersWorkload.sort((a, b) => b.total_assigned - a.total_assigned),
    unassigned_count: unassignedTasks.length,
  };
}
