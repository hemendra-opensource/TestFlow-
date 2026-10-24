import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/appError.js';

export const getDashboardMetrics = async (scopedSupabase, userId) => {
  try {
    // 1. Fetch accessible projects
    const { data: projects, error: projError } = await scopedSupabase
      .from('projects')
      .select('id, workspace_id, name, description, status, due_date, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (projError) {
      logger.error('Failed to fetch projects for dashboard', projError);
      throw new AppError('Failed to fetch dashboard metrics', 500);
    }

    const allProjects = projects || [];
    const activeProjects = allProjects.filter((p) => p.status === 'active');
    const recentProjects = allProjects.slice(0, 5);

    // 2. Fetch accessible tasks
    const { data: tasks, error: taskError } = await scopedSupabase
      .from('tasks')
      .select(`
        id, project_id, title, status, priority, due_date, assignee_id, created_at,
        project:projects(id, name, workspace_id)
      `)
      .order('created_at', { ascending: false });

    if (taskError) {
      logger.error('Failed to fetch tasks for dashboard', taskError);
      throw new AppError('Failed to fetch dashboard metrics', 500);
    }

    const allTasks = tasks || [];
    const today = new Date().toISOString().split('T')[0];

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const overdueTasks = allTasks.filter(
      (t) => t.status !== 'done' && t.due_date && t.due_date < today
    ).length;

    // Tasks assigned to the current user
    const assignedToMe = allTasks.filter(
      (t) => t.assignee_id === userId && t.status !== 'done'
    ).slice(0, 10);

    // Calculate progress for each recent project
    const recentWithStats = recentProjects.map((p) => {
      const projTasks = allTasks.filter((t) => t.project_id === p.id);
      const total = projTasks.length;
      const completed = projTasks.filter((t) => t.status === 'done').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        ...p,
        total_tasks: total,
        completed_tasks: completed,
        progress,
      };
    });

    return {
      active_projects_count: activeProjects.length,
      total_projects_count: allProjects.length,
      total_tasks_count: totalTasks,
      completed_tasks_count: completedTasks,
      overdue_tasks_count: overdueTasks,
      recent_projects: recentWithStats,
      assigned_tasks: assignedToMe,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Unexpected error fetching dashboard metrics', err);
    throw new AppError('Failed to fetch dashboard metrics', 500);
  }
};
