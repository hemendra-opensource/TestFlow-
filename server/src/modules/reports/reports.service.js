import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import { resolveAccessibleWorkspaces, computeDateBoundaries } from '../analytics/analytics.service.js';

/**
 * Escapes a cell value for RFC 4180 CSV compliance and neutralizes formula injection risks.
 */
export function sanitizeCsvCell(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  let text = String(value);

  // Prevent Spreadsheet Formula Injection (CSV injection)
  // If cell starts with '=', '+', '-', '@', tab, or carriage return, prepend with single quote
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  // If text contains quotes, commas, or newlines, escape quotes and wrap in quotes
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return `"${text}"`;
}

/**
 * Converts array of rows and headers to a safe CSV string with UTF-8 BOM.
 */
export function generateCsvString(headers, rows) {
  const headerLine = headers.map((h) => sanitizeCsvCell(h.label)).join(',');
  const rowLines = rows.map((row) =>
    headers.map((h) => sanitizeCsvCell(row[h.key])).join(',')
  );

  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel Unicode support
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Retrieves paginated, sorted, and filtered project reports.
 */
export async function getProjectReports(userId, scopedSupabase, query = {}) {
  const workspaceIds = await resolveAccessibleWorkspaces(userId, scopedSupabase, query.workspaceId);

  if (workspaceIds.length === 0) {
    return {
      data: [],
      pagination: { total: 0, page: query.page || 1, limit: query.limit || 10, totalPages: 0 },
    };
  }

  // 1. Fetch accessible projects
  let projectQuery = scopedSupabase
    .from('projects')
    .select(`
      id, workspace_id, name, description, status, start_date, due_date, created_at, updated_at,
      workspace:workspaces(id, name)
    `)
    .in('workspace_id', workspaceIds);

  if (query.status) {
    projectQuery = projectQuery.eq('status', query.status);
  }

  const { data: projectsData, error: projError } = await projectQuery;
  if (projError) {
    logger.error('Failed to query projects for report', projError);
    throw new AppError('Failed to generate project report', 500);
  }

  let projects = projectsData || [];

  // Filter by search term if provided
  if (query.search) {
    const term = query.search.toLowerCase();
    projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
    );
  }

  // 2. Fetch all tasks for these projects to compute metrics
  const projectIds = projects.map((p) => p.id);
  let allTasks = [];

  if (projectIds.length > 0) {
    const { data: tasksData, error: taskError } = await scopedSupabase
      .from('tasks')
      .select('id, project_id, status, due_date')
      .in('project_id', projectIds);

    if (taskError) {
      logger.error('Failed to query tasks for project report metrics', taskError);
      throw new AppError('Failed to generate project report', 500);
    }
    allTasks = tasksData || [];
  }

  const today = new Date().toISOString().split('T')[0];

  // 3. Compute per-project metrics
  const enriched = projects.map((p) => {
    const projTasks = allTasks.filter((t) => t.project_id === p.id);
    const total = projTasks.length;
    const completed = projTasks.filter((t) => t.status === 'done').length;
    const pending = projTasks.filter((t) => t.status !== 'done').length;
    const overdue = projTasks.filter(
      (t) => t.status !== 'done' && t.due_date && t.due_date < today
    ).length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      workspace_name: p.workspace?.name || 'Workspace',
      workspace_id: p.workspace_id,
      status: p.status,
      start_date: p.start_date || null,
      deadline: p.due_date || null,
      total_tasks: total,
      completed_tasks: completed,
      pending_tasks: pending,
      overdue_tasks: overdue,
      completion_percentage: completionPercentage,
      created_at: p.created_at,
    };
  });

  // 4. Sort
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  enriched.sort((a, b) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return -1 * sortOrder;
    if (valA > valB) return 1 * sortOrder;
    return 0;
  });

  // 5. Pagination
  const total = enriched.length;
  const page = query.page || 1;
  const limit = query.limit || 10;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedData = enriched.slice((page - 1) * limit, page * limit);

  return {
    data: paginatedData,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Retrieves paginated, sorted, and filtered task reports.
 */
export async function getTaskReports(userId, scopedSupabase, query = {}) {
  const workspaceIds = await resolveAccessibleWorkspaces(userId, scopedSupabase, query.workspaceId);

  if (workspaceIds.length === 0) {
    return {
      data: [],
      pagination: { total: 0, page: query.page || 1, limit: query.limit || 10, totalPages: 0 },
    };
  }

  // 1. Fetch projects in scope
  let projQuery = scopedSupabase
    .from('projects')
    .select('id, name, workspace_id')
    .in('workspace_id', workspaceIds);

  if (query.projectId) {
    projQuery = projQuery.eq('id', query.projectId);
  }

  const { data: projectsData, error: projError } = await projQuery;
  if (projError) {
    logger.error('Failed to query projects for task report', projError);
    throw new AppError('Failed to generate task report', 500);
  }

  const projects = projectsData || [];
  const projectIds = projects.map((p) => p.id);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  if (projectIds.length === 0) {
    return {
      data: [],
      pagination: { total: 0, page: query.page || 1, limit: query.limit || 10, totalPages: 0 },
    };
  }

  // 2. Fetch tasks
  let taskQuery = scopedSupabase
    .from('tasks')
    .select('id, project_id, title, description, status, priority, due_date, assignee_id, created_at, updated_at')
    .in('project_id', projectIds);

  if (query.status) {
    taskQuery = taskQuery.eq('status', query.status);
  }
  if (query.priority) {
    taskQuery = taskQuery.eq('priority', query.priority);
  }
  if (query.assigneeId) {
    taskQuery = taskQuery.eq('assignee_id', query.assigneeId);
  }

  const { startDate, endDate } = computeDateBoundaries(query);
  if (startDate) {
    taskQuery = taskQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    taskQuery = taskQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
  }

  const { data: tasksData, error: taskError } = await taskQuery;
  if (taskError) {
    logger.error('Failed to query tasks for task report', taskError);
    throw new AppError('Failed to generate task report', 500);
  }

  let tasks = tasksData || [];

  // Filter by search term
  if (query.search) {
    const term = query.search.toLowerCase();
    tasks = tasks.filter((t) => t.title.toLowerCase().includes(term));
  }

  // 3. Fetch assignee profiles for display
  const assigneeIds = Array.from(new Set(tasks.map((t) => t.assignee_id).filter(Boolean)));
  let profileMap = new Map();

  if (assigneeIds.length > 0) {
    const { data: profData } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', assigneeIds);
    profileMap = new Map((profData || []).map((p) => [p.id, p]));
  }

  // 4. Enrich tasks
  const enriched = tasks.map((t) => {
    const proj = projectMap.get(t.project_id);
    const assignee = t.assignee_id ? profileMap.get(t.assignee_id) : null;

    return {
      id: t.id,
      title: t.title,
      project_id: t.project_id,
      project_name: proj?.name || 'Project',
      status: t.status,
      priority: t.priority,
      assignee_id: t.assignee_id,
      assignee_name: assignee?.full_name || 'Unassigned',
      created_at: t.created_at,
      due_date: t.due_date || null,
    };
  });

  // 5. Sort
  const sortBy = query.sortBy || 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  enriched.sort((a, b) => {
    const valA = a[sortBy] ?? '';
    const valB = b[sortBy] ?? '';
    if (valA < valB) return -1 * sortOrder;
    if (valA > valB) return 1 * sortOrder;
    return 0;
  });

  // 6. Pagination
  const total = enriched.length;
  const page = query.page || 1;
  const limit = query.limit || 10;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginatedData = enriched.slice((page - 1) * limit, page * limit);

  return {
    data: paginatedData,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

/**
 * Generates full CSV export string for filtered report data.
 */
export async function generateReportExport(userId, scopedSupabase, query = {}) {
  const type = query.type || 'projects';

  if (type === 'projects') {
    // Fetch full filtered list up to 5000 rows
    const report = await getProjectReports(userId, scopedSupabase, {
      ...query,
      page: 1,
      limit: 5000,
    });

    const headers = [
      { key: 'name', label: 'Project Name' },
      { key: 'workspace_name', label: 'Workspace' },
      { key: 'status', label: 'Status' },
      { key: 'total_tasks', label: 'Total Tasks' },
      { key: 'completed_tasks', label: 'Completed Tasks' },
      { key: 'pending_tasks', label: 'Pending Tasks' },
      { key: 'overdue_tasks', label: 'Overdue Tasks' },
      { key: 'completion_percentage', label: 'Completion %' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'deadline', label: 'Deadline' },
      { key: 'created_at', label: 'Created At' },
    ];

    const csvContent = generateCsvString(headers, report.data);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `teamflow-projects-report-${dateStr}.csv`;

    return { csvContent, filename };
  } else {
    // Tasks report export
    const report = await getTaskReports(userId, scopedSupabase, {
      ...query,
      page: 1,
      limit: 5000,
    });

    const headers = [
      { key: 'title', label: 'Task Title' },
      { key: 'project_name', label: 'Project' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'assignee_name', label: 'Assignee' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'due_date', label: 'Due Date' },
    ];

    const csvContent = generateCsvString(headers, report.data);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `teamflow-tasks-report-${dateStr}.csv`;

    return { csvContent, filename };
  }
}
