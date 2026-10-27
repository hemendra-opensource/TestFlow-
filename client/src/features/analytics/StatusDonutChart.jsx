import React from 'react';
import { PieChart as PieIcon } from 'lucide-react';

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    color: '#94a3b8',
    bgColor: 'bg-slate-400',
    ringColor: 'border-slate-300',
  },
  in_progress: {
    label: 'In Progress',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    ringColor: 'border-blue-300',
  },
  in_review: {
    label: 'In Review',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    ringColor: 'border-amber-300',
  },
  done: {
    label: 'Completed',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    ringColor: 'border-emerald-300',
  },
};

export function StatusDonutChart({ data = {}, isLoading = false }) {
  const total = data.total || 0;
  const distribution = data.distribution || {
    todo: { count: 0, percentage: 0 },
    in_progress: { count: 0, percentage: 0 },
    in_review: { count: 0, percentage: 0 },
    done: { count: 0, percentage: 0 },
  };

  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke offsets for each slice
  let currentOffset = 0;
  const slices = Object.entries(STATUS_CONFIG).map(([key, config]) => {
    const item = distribution[key] || { count: 0, percentage: 0 };
    const strokeDasharray = total > 0 ? (item.percentage / 100) * circumference : 0;
    const offset = currentOffset;
    if (total > 0) {
      currentOffset += strokeDasharray;
    }
    return {
      key,
      ...config,
      count: item.count,
      percentage: item.percentage,
      strokeDasharray: `${strokeDasharray} ${circumference}`,
      strokeDashoffset: -offset,
    };
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">Task Status Distribution</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {total} {total === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center animate-pulse">
          <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-brand-500 animate-spin"></div>
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
            <PieIcon className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-600">No tasks in current filter</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tasks will appear here once created</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
          {/* SVG Donut */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 160 160"
            >
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-100"
                strokeWidth="18"
                stroke="currentColor"
                fill="transparent"
              />
              {slices.map((slice) =>
                slice.count > 0 ? (
                  <circle
                    key={slice.key}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth="18"
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500"
                  />
                ) : null
              )}
            </svg>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 leading-none">{total}</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Tasks
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2.5 w-full sm:w-auto min-w-[150px]">
            {slices.map((slice) => (
              <div key={slice.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${slice.bgColor}`} />
                  <span className="text-slate-700 font-medium">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-slate-900">{slice.count}</span>
                  <span className="text-[11px] text-slate-400 w-9 text-right font-normal">
                    ({slice.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
