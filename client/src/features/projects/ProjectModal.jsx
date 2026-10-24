import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Input } from '../../components/Input.jsx';
import { Alert } from '../../components/Alert.jsx';

export const ProjectModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setStatus(initialData.status || 'active');
        setStartDate(initialData.start_date || '');
        setDueDate(initialData.due_date || '');
      } else {
        setName('');
        setDescription('');
        setStatus('active');
        setStartDate('');
        setDueDate('');
      }
      setErrors({});
      setApiError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Project name is required';
    } else if (name.trim().length > 100) {
      errs.name = 'Project name cannot exceed 100 characters';
    }

    if (description && description.length > 1000) {
      errs.description = 'Description cannot exceed 1000 characters';
    }

    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      errs.dueDate = 'Due date cannot be earlier than start date';
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
        name: name.trim(),
        description: description.trim() || null,
        status,
        start_date: startDate || null,
        due_date: dueDate || null,
      });
      onClose();
    } catch (err) {
      setApiError(err.message || 'Failed to save project. Please verify inputs.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">
            {isEditing ? 'Edit Project' : 'Create New Project'}
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
            <Alert type="error" title="Submission Error">
              {apiError}
            </Alert>
          )}

          <div>
            <Input
              label="Project Name *"
              id="project-name"
              placeholder="e.g. Website Redesign Q4"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              error={errors.name}
              required
            />
          </div>

          <div>
            <label htmlFor="project-desc" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              id="project-desc"
              rows={3}
              placeholder="Outline project objectives, milestones, or scope..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none transition-colors"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-status" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="project-start-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Date
              </label>
              <input
                id="project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-due-date" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Due Date / Deadline
            </label>
            <input
              id="project-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: null }));
              }}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
            />
            {errors.dueDate && (
              <p className="mt-1 text-xs text-rose-600">{errors.dueDate}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
