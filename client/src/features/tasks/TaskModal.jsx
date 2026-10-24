import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, AlertCircle, User, Flag } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Input } from '../../components/Input.jsx';
import { Alert } from '../../components/Alert.jsx';
import { useWorkspaceMembers } from '../workspaces/useWorkspaces.js';
import { useAuth } from '../auth/useAuth.js';

export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData = null,
  defaultStatus = 'todo',
  workspaceId,
  isSubmitting = false,
  userRole = 'member',
}) => {
  const { user } = useAuth();
  const isEditing = Boolean(initialData?.id);
  const { data: members = [] } = useWorkspaceMembers(workspaceId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setStatus(initialData.status || 'todo');
        setPriority(initialData.priority || 'medium');
        setAssigneeId(initialData.assignee_id || '');
        setDueDate(initialData.due_date || '');
      } else {
        setTitle('');
        setDescription('');
        setStatus(defaultStatus || 'todo');
        setPriority('medium');
        setAssigneeId('');
        setDueDate('');
      }
      setErrors({});
      setApiError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData, defaultStatus]);

  if (!isOpen) return null;

  const canDelete =
    isEditing &&
    (['owner', 'admin'].includes(userRole) ||
      (userRole === 'member' && initialData?.created_by === user?.id));

  const validate = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Task title is required';
    } else if (title.trim().length > 200) {
      errs.title = 'Task title cannot exceed 200 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      await onSubmit({
        ...(isEditing ? { taskId: initialData.id } : {}),
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assignee_id: assigneeId || null,
        due_date: dueDate || null,
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save task.');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(initialData.id);
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to delete task.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {apiError && (
            <Alert type="error" title="Task Error">
              {apiError}
            </Alert>
          )}

          <div>
            <Input
              label="Task Title *"
              id="task-title"
              placeholder="e.g. Design responsive navbar component"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
              }}
              error={errors.title}
              required
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              placeholder="Add details, acceptance criteria, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-status" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-priority" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-assignee" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name || 'Member'} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-due-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Delete confirmation section */}
          {showDeleteConfirm && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 space-y-2">
              <p className="font-semibold">Are you sure you want to permanently delete this task?</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={isSubmitting}
                >
                  Yes, Delete Task
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {canDelete && !showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Task</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {isEditing ? 'Save Changes' : 'Create Task'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
