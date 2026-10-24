import React, { useState } from 'react';
import { KanbanColumn } from './KanbanColumn.jsx';
import { useUpdateTask } from '../tasks/useTasks.js';

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];

export const KanbanBoard = ({
  projectId,
  tasks = [],
  onEditTask,
  onAddTask,
  canEdit = true,
}) => {
  const updateTaskMutation = useUpdateTask(projectId);
  const [dragError, setDragError] = useState(null);

  const handleDropTask = async (taskId, newStatus) => {
    if (!canEdit) return;
    setDragError(null);

    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        status: newStatus,
      });
    } catch (err) {
      console.error('Failed to move task:', err);
      setDragError('Failed to move task. Reverted to previous state.');
      setTimeout(() => setDragError(null), 4000);
    }
  };

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    in_review: tasks.filter((t) => t.status === 'in_review'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="space-y-3">
      {dragError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center justify-between">
          <span>{dragError}</span>
          <button
            type="button"
            onClick={() => setDragError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* 4-column horizontal scrollable container on smaller screens, grid on large */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {COLUMNS.map((colStatus) => (
          <KanbanColumn
            key={colStatus}
            status={colStatus}
            tasks={tasksByStatus[colStatus] || []}
            onEditTask={onEditTask}
            onAddTask={onAddTask}
            onDropTask={handleDropTask}
            canEdit={canEdit}
          />
        ))}
      </div>
    </div>
  );
};
