import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight, FolderKanban } from 'lucide-react';
import { Badge } from '../../components/Badge.jsx';

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  completed: { label: 'Completed', color: 'bg-blue-50 text-blue-700 ring-blue-200' },
  on_hold: { label: 'On Hold', color: 'bg-amber-50 text-amber-700 ring-amber-200' },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

export const ProjectCard = ({ project }) => {
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const total = project.total_tasks || 0;
  const completed = project.completed_tasks || 0;
  const progress = project.progress !== undefined ? project.progress : (total > 0 ? Math.round((completed / total) * 100) : 0);

  const isOverdue =
    project.status !== 'completed' &&
    project.status !== 'archived' &&
    project.due_date &&
    new Date(project.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link
      to={`/projects/${project.id}`}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
              <FolderKanban className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate text-base">
              {project.name}
            </h3>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${statusCfg.color} shrink-0`}>
            {statusCfg.label}
          </span>
        </div>

        {project.description ? (
          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic mt-2">No description provided</p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600">Progress</span>
            <span className="font-bold text-slate-800">
              {progress}% ({completed}/{total} tasks)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress === 100 ? 'bg-emerald-500' : 'bg-brand-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Due date and arrow */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            {isOverdue ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                Due {formatDate(project.due_date)} (Overdue)
              </span>
            ) : project.due_date ? (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDate(project.due_date)}
              </span>
            ) : (
              <span className="text-slate-400">No deadline</span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
            Open Board <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};
