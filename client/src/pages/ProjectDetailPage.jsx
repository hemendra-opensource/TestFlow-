import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Settings,
  Search,
  Filter,
  Kanban,
  ListFilter,
  CheckCircle2,
  FolderKanban,
  Users,
  ChevronRight,
  AlertCircle,
  Loader2,
  Sparkles,
  Archive,
  UserPlus,
} from 'lucide-react';
import { AddMemberModal } from '../features/workspaces/AddMemberModal.jsx';
import { useProject, useUpdateProject, useDeleteProject } from '../features/projects/useProjects.js';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../features/tasks/useTasks.js';
import { useTaskRealtime } from '../features/tasks/useTaskRealtime.js';
import { useWorkspace, useWorkspaceMembers } from '../features/workspaces/useWorkspaces.js';
import { KanbanBoard } from '../features/kanban/KanbanBoard.jsx';
import { TaskModal } from '../features/tasks/TaskModal.jsx';
import { ProjectModal } from '../features/projects/ProjectModal.jsx';
import { Button } from '../components/Button.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { Alert } from '../components/Alert.jsx';
import { useAuth } from '../features/auth/useAuth.js';

export const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();

  // Project data
  const { data: project, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const workspaceId = project?.workspace_id;

  // Workspace data for role & members
  const { data: workspace } = useWorkspace(workspaceId);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);

  // Realtime subscription on tasks
  useTaskRealtime(projectId);

  // Filters & View State
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  // Task queries & mutations
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks(projectId, {
    search,
    status: statusFilter,
    priority: priorityFilter,
    assignee_id: assigneeFilter,
  });

  const createTaskMutation = useCreateTask(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);
  const updateProjectMutation = useUpdateProject(projectId, workspaceId);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState('todo');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const userRole = workspace?.role || 'member';
  const canEditProject = ['owner', 'admin'].includes(userRole);
  const canCreateTask = ['owner', 'admin', 'member'].includes(userRole);

  if (isProjectLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-6 text-center">
        <Spinner size="lg" className="text-brand-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Loading project & board...</p>
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Project Not Found or Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          You may not have permission to view this project, or it might have been removed.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" size="sm" leftIcon={ArrowLeft}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const handleOpenAddTask = (status = 'todo') => {
    setEditingTask(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (taskData) => {
    if (editingTask) {
      await updateTaskMutation.mutateAsync(taskData);
    } else {
      await createTaskMutation.mutateAsync(taskData);
    }
  };

  const handleTaskDelete = async (taskId) => {
    await deleteTaskMutation.mutateAsync(taskId);
  };

  const handleProjectUpdate = async (projectData) => {
    await updateProjectMutation.mutateAsync(projectData);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        {workspace && (
          <>
            <Link to={`/workspaces/${workspace.id}`} className="hover:text-brand-600 transition-colors truncate max-w-[150px]">
              {workspace.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </>
        )}
        <span className="text-slate-900 truncate max-w-[200px]">{project.name}</span>
      </nav>

      {/* Hero Project Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-200 border border-brand-400/20">
                <FolderKanban className="h-3.5 w-3.5" />
                <span className="capitalize">{project.status}</span>
              </span>

              {project.due_date && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-slate-300 bg-white/5 border border-white/10">
                  <Calendar className="h-3 w-3" />
                  Due {new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-sm text-slate-300 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Live Progress Bar */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                <span className="font-semibold">Project Completion</span>
                <span className="font-bold text-white">
                  {project.progress}% ({project.completed_tasks}/{project.total_tasks} tasks)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canCreateTask && (
              <Button
                variant="primary"
                size="md"
                leftIcon={Plus}
                onClick={() => handleOpenAddTask('todo')}
                className="bg-brand-500 text-white hover:bg-brand-400 font-semibold shadow-sm"
              >
                Add Task
              </Button>
            )}

            {canEditProject && (
              <Button
                variant="outline"
                size="md"
                leftIcon={UserPlus}
                onClick={() => setIsAddMemberOpen(true)}
                className="border-white/20 text-white hover:bg-white/10 font-medium"
              >
                Add Member
              </Button>
            )}

            {canEditProject && (
              <Button
                variant="outline"
                size="md"
                leftIcon={Settings}
                onClick={() => setIsProjectModalOpen(true)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Edit Project
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-brand-500 max-w-[150px] truncate"
          >
            <option value="all">All Assignees</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name || 'Member'}
              </option>
            ))}
          </select>

          {/* View switcher */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View: Kanban Board OR Task List */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          projectId={projectId}
          tasks={tasks}
          onEditTask={handleOpenEditTask}
          onAddTask={handleOpenAddTask}
          canEdit={canCreateTask}
        />
      ) : (
        /* Task List View */
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => handleOpenEditTask(task)}
                    className="hover:bg-brand-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {task.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium">
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {task.assignee?.full_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      {task.due_date || 'No deadline'}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No tasks found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        onDelete={handleTaskDelete}
        initialData={editingTask}
        defaultStatus={defaultTaskStatus}
        workspaceId={workspaceId}
        isSubmitting={createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending}
        userRole={userRole}
      />

      {/* Project Modal (Edit Project) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectUpdate}
        initialData={project}
        isSubmitting={updateProjectMutation.isPending}
      />

      {/* Add Member Modal */}
      {workspaceId && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          workspaceId={workspaceId}
          existingMembers={members || []}
        />
      )}
    </div>
  );
};
