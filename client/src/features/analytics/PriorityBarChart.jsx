import React from 'react';
import { BarChart3 } from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: {
    label: 'Urgent',
    barColor: 'bg-rose-500',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
  },
  high: {
    label: 'High',
    barColor: 'bg-amber-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    barColor: 'bg-blue-500',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  low: {
    label: 'Low',
    barColor: 'bg-slate-400',
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    dotColor: 'bg-slate-400',
  },
};

export function PriorityBarChart({ data = {}, isLoading = false }) {
  const total = data.total || 0;
  const distribution = data.distribution || {
    low: { count: 0, percentage: 0 },
    medium: { count: 0, percentage: 0 },
    high: { count: 0, percentage: 0 },
    urgent: { count: 0, percentage: 0 },
  };

  const priorityOrder = ['urgent', 'high', 'medium', 'low'];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">Priority Distribution</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {total} {total === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center animate-pulse">
          <div className="w-full space-y-4">
            <div className="h-6 bg-slate-200 rounded-full w-full"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-600">No tasks in current filter</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Priorities will appear here once created</p>
        </div>
      ) : (
        <div className="space-y-5 my-2">
          {/* Stacked Horizontal Bar */}
          <div>
            <div className="h-5 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5 gap-0.5 shadow-inner">
              {priorityOrder.map((key) => {
                const item = distribution[key] || { count: 0, percentage: 0 };
                const config = PRIORITY_CONFIG[key];
                if (item.percentage === 0) return null;
                return (
                  <div
                    key={key}
                    style={{ width: `${item.percentage}%` }}
                    className={`${config.barColor} h-full rounded-sm transition-all duration-500 relative group`}
                    title={`${config.label}: ${item.count} (${item.percentage}%)`}
                  />
                );
              })}
            </div>
          </div>

          {/* Detailed Priority Rows */}
          <div className="grid grid-cols-2 gap-3">
            {priorityOrder.map((key) => {
              const item = distribution[key] || { count: 0, percentage: 0 };
              const config = PRIORITY_CONFIG[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                    <span className="text-xs font-semibold text-slate-700">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <span>{item.count}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
