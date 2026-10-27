import React from 'react';
import { Filter, Calendar, RotateCcw } from 'lucide-react';
import { useWorkspaces } from '../workspaces/useWorkspaces.js';
import { useProjects } from '../projects/useProjects.js';

export function AnalyticsFilterBar({ filters, onFilterChange, onReset }) {
  const { data: workspaces = [] } = useWorkspaces();
  const selectedWorkspaceId = filters.workspace_id !== 'all' ? filters.workspace_id : null;
  const { data: projects = [] } = useProjects(selectedWorkspaceId);

  const datePresets = [
    { label: 'All Time', value: 'all' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-6 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
          <Filter className="w-4 h-4 text-brand-600" />
          <span>Filters & Date Range</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Workspace select */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Workspace
          </label>
          <select
            value={filters.workspace_id || 'all'}
            onChange={(e) => {
              onFilterChange({
                ...filters,
                workspace_id: e.target.value,
                project_id: 'all', // Reset project when workspace changes
              });
            }}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project select */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Project
          </label>
          <select
            value={filters.project_id || 'all'}
            onChange={(e) => onFilterChange({ ...filters, project_id: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Projects</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status select */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
          </select>
        </div>

        {/* Priority select */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Priority
          </label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
            className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Date Preset select */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Date Range
          </label>
          <div className="relative">
            <select
              value={filters.datePreset || 'all'}
              onChange={(e) => onFilterChange({ ...filters, datePreset: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-2.5 text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            >
              {datePresets.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Custom Date Pickers (visible if custom selected) */}
      {filters.datePreset === 'custom' && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 font-medium">Custom Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
            />
          </div>
        </div>
      )}
    </div>
  );
}
