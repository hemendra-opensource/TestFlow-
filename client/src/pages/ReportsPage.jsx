import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import {
  useProjectReports,
  useTaskReports,
  useExportReport,
} from '../features/reports/useReports.js';
import { useWorkspaces } from '../features/workspaces/useWorkspaces.js';
import { Button } from '../components/Button.jsx';
import { Badge } from '../components/Badge.jsx';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'tasks'

  // Workspace selector for filtering
  const { data: workspaces = [] } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');

  // Filters for Projects Report
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatus, setProjectStatus] = useState('all');
  const [projectPage, setProjectPage] = useState(1);
  const [projectSortBy, setProjectSortBy] = useState('created_at');
  const [projectSortOrder, setProjectSortOrder] = useState('desc');

  // Filters for Tasks Report
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState('all');
  const [taskPriority, setTaskPriority] = useState('all');
  const [taskPage, setTaskPage] = useState(1);
  const [taskSortBy, setTaskSortBy] = useState('created_at');
  const [taskSortOrder, setTaskSortOrder] = useState('desc');

  // Queries
  const {
    data: projectReportData,
    isLoading: loadingProjects,
    isFetching: fetchingProjects,
  } = useProjectReports({
    workspace_id: selectedWorkspace,
    search: projectSearch,
    status: projectStatus,
    page: projectPage,
    limit: 10,
    sortBy: projectSortBy,
    sortOrder: projectSortOrder,
  });

  const {
    data: taskReportData,
    isLoading: loadingTasks,
    isFetching: fetchingTasks,
  } = useTaskReports({
    workspace_id: selectedWorkspace,
    search: taskSearch,
    status: taskStatus,
    priority: taskPriority,
    page: taskPage,
    limit: 10,
    sortBy: taskSortBy,
    sortOrder: taskSortOrder,
  });

  // Export mutation
  const { mutate: exportReport, isPending: exporting } = useExportReport();

  const handleExport = (type) => {
    if (type === 'projects') {
      exportReport({
        type: 'projects',
        workspace_id: selectedWorkspace,
        search: projectSearch,
        status: projectStatus,
      });
    } else {
      exportReport({
        type: 'tasks',
        workspace_id: selectedWorkspace,
        search: taskSearch,
        status: taskStatus,
        priority: taskPriority,
      });
    }
  };

  const projectList = projectReportData?.data || [];
  const projectPagination = projectReportData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const taskList = taskReportData?.data || [];
  const taskPagination = taskReportData?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Project & Task Reports
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Detailed breakdowns, sortable metrics and secure CSV data export
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/analytics">
            <Button variant="outline" size="sm" leftIcon={BarChart3}>
              Analytics Dashboard
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            leftIcon={Download}
            disabled={exporting}
            onClick={() => handleExport(activeTab)}
          >
            {exporting ? 'Generating CSV...' : `Export ${activeTab === 'projects' ? 'Projects' : 'Tasks'} CSV`}
          </Button>
        </div>
      </div>

      {/* Tabs and Common Workspace Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'projects'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            Projects Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            Tasks Report
          </button>
        </div>

        {/* Global Workspace selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Workspace:</span>
          <select
            value={selectedWorkspace}
            onChange={(e) => {
              setSelectedWorkspace(e.target.value);
              setProjectPage(1);
              setTaskPage(1);
            }}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Accessible Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Report Tab Content */}
      {activeTab === 'projects' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    setProjectPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <select
                value={projectStatus}
                onChange={(e) => {
                  setProjectStatus(e.target.value);
                  setProjectPage(1);
                }}
                className="text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {projectList.length} of {projectPagination.total} projects
            </div>
          </div>

          {/* Table */}
          {loadingProjects ? (
            <div className="p-12 space-y-3 animate-pulse">
              <div className="h-8 bg-slate-100 rounded w-full"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
            </div>
          ) : projectList.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs font-semibold text-slate-600">No projects found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try refining your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Workspace</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Tasks</th>
                    <th className="py-3 px-4 text-center">Completed</th>
                    <th className="py-3 px-4 w-40">Progress</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {projectList.map((p) => {
                    const statusVariant =
                      p.status === 'completed'
                        ? 'member'
                        : p.status === 'archived'
                        ? 'default'
                        : 'owner';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            to={`/projects/${p.id}`}
                            className="font-bold text-slate-900 hover:text-brand-600 transition-colors"
                          >
                            {p.name}
                          </Link>
                          {p.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {p.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {p.workspace_name || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant} size="xs">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center font-semibold text-slate-800">
                          {p.total_tasks}
                        </td>
                        <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                          {p.completed_tasks}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-brand-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${p.completion_rate}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">
                              {p.completion_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {projectPagination.page} of {projectPagination.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={projectPage <= 1 || fetchingProjects}
                onClick={() => setProjectPage((prev) => Math.max(1, prev - 1))}
                leftIcon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={projectPage >= (projectPagination.totalPages || 1) || fetchingProjects}
                onClick={() => setProjectPage((prev) => prev + 1)}
                rightIcon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Report Tab Content */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => {
                    setTaskSearch(e.target.value);
                    setTaskPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                />
              </div>

              <select
                value={taskStatus}
                onChange={(e) => {
                  setTaskStatus(e.target.value);
                  setTaskPage(1);
                }}
                className="text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Completed</option>
              </select>

              <select
                value={taskPriority}
                onChange={(e) => {
                  setTaskPriority(e.target.value);
                  setTaskPage(1);
                }}
                className="text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {taskList.length} of {taskPagination.total} tasks
            </div>
          </div>

          {/* Table */}
          {loadingTasks ? (
            <div className="p-12 space-y-3 animate-pulse">
              <div className="h-8 bg-slate-100 rounded w-full"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
            </div>
          ) : taskList.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-xs font-semibold text-slate-600">No tasks found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try refining your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Task Title</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {taskList.map((t) => {
                    const statusVariant =
                      t.status === 'done'
                        ? 'member'
                        : t.status === 'in_progress'
                        ? 'owner'
                        : t.status === 'in_review'
                        ? 'viewer'
                        : 'default';

                    const priorityVariant =
                      t.priority === 'urgent'
                        ? 'admin'
                        : t.priority === 'high'
                        ? 'viewer'
                        : 'default';

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{t.title}</span>
                          {t.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-xs">
                              {t.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {t.project_name || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {t.assignee_name || t.assignee_email ? (
                            <div className="flex items-center gap-2">
                              {t.assignee_avatar ? (
                                <img
                                  src={t.assignee_avatar}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                  {(t.assignee_name || t.assignee_email).charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-slate-700">
                                {t.assignee_name || t.assignee_email.split('@')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={statusVariant} size="xs">
                            {t.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={priorityVariant} size="xs">
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {taskPagination.page} of {taskPagination.totalPages || 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={taskPage <= 1 || fetchingTasks}
                onClick={() => setTaskPage((prev) => Math.max(1, prev - 1))}
                leftIcon={ChevronLeft}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={taskPage >= (taskPagination.totalPages || 1) || fetchingTasks}
                onClick={() => setTaskPage((prev) => prev + 1)}
                rightIcon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ReportsPage;
