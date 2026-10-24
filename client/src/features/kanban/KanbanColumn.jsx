import React, { useState } from 'react';
import { Plus, CheckCircle2, Clock, PlayCircle, Eye } from 'lucide-react';
import { TaskCard } from './TaskCard.jsx';

const COLUMN_CONFIG = {
  todo: {
    title: 'To Do',
    icon: Clock,
    color: 'bg-slate-100 text-slate-700',
    headerAccent: 'border-slate-300',
  },
  in_progress: {
    title: 'In Progress',
    icon: PlayCircle,
    color: 'bg-blue-100 text-blue-700',
    headerAccent: 'border-blue-400',
  },
  in_review: {
    title: 'In Review',
    icon: Eye,
    color: 'bg-amber-100 text-amber-700',
    headerAccent: 'border-amber-400',
  },
  done: {
    title: 'Done',
    icon: CheckCircle2,
    color: 'bg-emerald-100 text-emerald-700',
    headerAccent: 'border-emerald-400',
  },
};

export const KanbanColumn = ({
  status,
  tasks = [],
  onEditTask,
  onAddTask,
  onDropTask,
  canEdit = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cfg = COLUMN_CONFIG[status] || COLUMN_CONFIG.todo;
  const Icon = cfg.icon;

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!canEdit) return;
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    // Only set false if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!canEdit) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { taskId, currentStatus } = JSON.parse(dataStr);
      if (currentStatus !== status) {
        onDropTask(taskId, status);
      }
    } catch (err) {
      console.warn('Error parsing drag drop data:', err);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[270px] max-w-sm rounded-2xl bg-slate-50/80 border transition-all duration-200 p-3.5 ${
        isDragOver
          ? 'border-brand-500 bg-brand-50/40 ring-2 ring-brand-400/20 shadow-md'
          : 'border-slate-200/80 shadow-xs'
      }`}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${cfg.headerAccent} mb-3`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <h3 className="font-bold text-sm text-slate-800">{cfg.title}</h3>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${cfg.color}`}>
            {tasks.length}
          </span>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => onAddTask(status)}
            className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition-colors"
            title={`Add task to ${cfg.title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[300px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onStatusChange={(taskId, newStatus) => onDropTask(taskId, newStatus)}
            canEdit={canEdit}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs text-center p-3">
            <span>No tasks in {cfg.title.toLowerCase()}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => onAddTask(status)}
                className="mt-1.5 text-brand-600 hover:text-brand-700 font-medium hover:underline text-xs"
              >
                + Add a task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
