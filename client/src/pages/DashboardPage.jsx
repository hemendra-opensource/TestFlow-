import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ListTodo,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { useWorkspaces } from '../features/workspaces/useWorkspaces.js';
import { useDashboardStats } from '../features/tasks/useTasks.js';
import { WorkspaceList } from '../features/workspaces/WorkspaceList.jsx';
import { ProjectCard } from '../features/projects/ProjectCard.jsx';
import { Button } from '../components/Button.jsx';
import { Spinner } from '../components/Spinner.jsx';

export const DashboardPage = () => {
  const { user, profile } = useAuth();
  const { data: workspaces, isLoading: wsLoading, error: wsError, refetch } = useWorkspaces();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Team Member';
  const totalWorkspaces = workspaces?.length || 0;

  const activeProjectsCount = stats?.active_projects_count ?? 0;
  const totalTasksCount = stats?.total_tasks_count ?? 0;
  const completedTasksCount = stats?.completed_tasks_count ?? 0;
  const overdueTasksCount = stats?.overdue_tasks_count ?? 0;
  const recentProjects = stats?.recent_projects || [];
  const assignedTasks = stats?.assigned_tasks || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-200 text-xs font-semibold mb-3 border border-brand-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TeamFlow — Phase 3: Projects & Kanban Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-sm text-brand-100 max-w-xl leading-relaxed">
              Real-time project tracking, agile Kanban boards, and isolated workspaces protected by PostgreSQL Row Level Security.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <Link to="/workspaces/new">
              <Button
                variant="primary"
                size="md"
                leftIcon={Plus}
                className="bg-white text-brand-900 hover:bg-brand-50 shadow-md font-semibold focus:ring-white"
              >
                Create Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Calculated Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Projects */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</p>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {statsLoading ? '...' : activeProjectsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all your workspaces</p>
        </div>

        {/* Total Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {statsLoading ? '...' : totalTasksCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across Kanban boards</p>
        </div>

        {/* Completed Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {statsLoading ? '...' : completedTasksCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalTasksCount > 0 ? `${Math.round((completedTasksCount / totalTasksCount) * 100)}% overall completion` : 'No tasks recorded'}
          </p>
        </div>

        {/* Overdue Tasks */}
        <div className={`rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-sm ${
          overdueTasksCount > 0 ? 'border-rose-200 bg-rose-50/50' : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Tasks</p>
            <div className={`p-2 rounded-lg ${overdueTasksCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-2 ${overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {statsLoading ? '...' : overdueTasksCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {overdueTasksCount > 0 ? 'Action required' : 'All deadlines on track'}
          </p>
        </div>
      </div>

      {/* Recent Projects Section */}
      {recentProjects.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active & Recent Projects</h2>
              <p className="text-xs text-slate-500">Jump right into your project Kanban boards.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}

      {/* Tasks Assigned to You Section */}
      {assignedTasks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">Tasks Assigned to You</h2>
              <span className="ml-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                {assignedTasks.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {assignedTasks.map((task) => (
              <Link
                key={task.id}
                to={`/projects/${task.project_id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                      {task.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="text-slate-600 font-medium">{task.project?.name || 'Project'}</span>
                    {task.due_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Open Board <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Workspace List Section (Preserved) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Workspaces</h2>
            <p className="text-xs text-slate-500">Workspaces you belong to based on verified PostgreSQL membership.</p>
          </div>
          <Link to="/workspaces/new">
            <Button variant="outline" size="sm" leftIcon={Plus}>
              New Workspace
            </Button>
          </Link>
        </div>

        <WorkspaceList
          workspaces={workspaces}
          isLoading={wsLoading}
          error={wsError}
          refetch={refetch}
        />
      </div>
    </div>
  );
};
