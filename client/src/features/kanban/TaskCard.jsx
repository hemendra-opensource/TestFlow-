import React, { useState } from 'react';
import { Calendar, AlertCircle, GripVertical, MoreVertical, CheckCircle2, User, Clock, ArrowRight } from 'lucide-react';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', bg: 'bg-rose-50 text-rose-700 ring-rose-200' },
  high: { label: 'High', bg: 'bg-amber-50 text-amber-700 ring-amber-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50 text-blue-700 ring-blue-200' },
  low: { label: 'Low', bg: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

export const TaskCard = ({ task, onEdit, onStatusChange, canEdit = true }) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const isOverdue =
    task.status !== 'done' &&
    task.due_date &&
    new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const assigneeInitials = task.assignee?.full_name
    ? task.assignee.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : null;

  const handleDragStart = (e) => {
    if (!canEdit) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: task.id, currentStatus: task.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={canEdit}
      onDragStart={handleDragStart}
      className={`group relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-150 ${
        canEdit
          ? 'hover:border-brand-300 hover:shadow-md cursor-grab active:cursor-grabbing'
          : 'opacity-90'
      }`}
    >
      {/* Header: Priority & Quick Move */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${priorityCfg.bg}`}>
          {priorityCfg.label}
        </span>

        {canEdit && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu((prev) => !prev);
              }}
              aria-label="Move task"
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Change status"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {showMoveMenu && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1 z-30 w-36 rounded-lg bg-white p-1 shadow-lg ring-1 ring-slate-200">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Move to
                  </div>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.value === task.status}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMoveMenu(false);
                        onStatusChange(task.id, opt.value);
                      }}
                      className={`w-full text-left px-2 py-1 text-xs rounded transition-colors flex items-center justify-between ${
                        opt.value === task.status
                          ? 'text-slate-300 bg-slate-50 cursor-not-allowed'
                          : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700 font-medium'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.value === task.status && <CheckCircle2 className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Task Title (click to edit) */}
      <h4
        onClick={() => onEdit(task)}
        className="font-semibold text-slate-900 text-sm hover:text-brand-600 cursor-pointer transition-colors leading-snug"
      >
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer: Due date and Assignee */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          {isOverdue ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              <AlertCircle className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          ) : task.due_date ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          ) : null}
        </div>

        {/* Assignee Avatar / Pill */}
        {task.assignee ? (
          <div
            className="flex items-center gap-1.5"
            title={`Assigned to ${task.assignee.full_name || 'Member'}`}
          >
            {task.assignee.avatar_url ? (
              <img
                src={task.assignee.avatar_url}
                alt={task.assignee.full_name || 'Assignee'}
                className="h-6 w-6 rounded-full object-cover ring-1 ring-white"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center ring-1 ring-white">
                {assigneeInitials || 'U'}
              </div>
            )}
            <span className="text-[11px] text-slate-600 font-medium max-w-[80px] truncate">
              {task.assignee.full_name?.split(' ')[0] || 'Member'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
        )}
      </div>
    </div>
  );
};
