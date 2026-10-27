import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ListTodo,
} from 'lucide-react';

export function OverviewCards({ metrics = {}, isLoading = false }) {
  const {
    total_projects = 0,
    active_projects = 0,
    completed_projects = 0,
    total_tasks = 0,
    tasks_completed = 0,
    tasks_in_progress = 0,
    tasks_in_review = 0,
    tasks_pending = 0,
    tasks_overdue = 0,
    completion_rate = 0,
  } = metrics;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Projects Overview',
      value: total_projects,
      subtext: `${active_projects} active · ${completed_projects} completed`,
      icon: FolderKanban,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Total Tasks',
      value: total_tasks,
      subtext: `${tasks_in_progress} in progress · ${tasks_pending} pending`,
      icon: ListTodo,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Overdue Tasks',
      value: tasks_overdue,
      subtext: tasks_overdue > 0 ? 'Requires immediate attention' : 'All deadlines on track',
      icon: AlertTriangle,
      color: tasks_overdue > 0 ? 'text-rose-600' : 'text-emerald-600',
      bgColor: tasks_overdue > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Task Completion Rate',
      value: `${completion_rate}%`,
      subtext: `${tasks_completed} of ${total_tasks} tasks completed`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border ${card.bgColor} ${card.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
