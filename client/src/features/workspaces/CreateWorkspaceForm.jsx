import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Hash, ArrowLeft, Check } from 'lucide-react';
import { useCreateWorkspace } from './useWorkspaces.js';
import { Input } from '../../components/Input.jsx';
import { Button } from '../../components/Button.jsx';
import { Alert } from '../../components/Alert.jsx';
import { slugify } from '../../lib/utils.js';

export const CreateWorkspaceForm = () => {
  const navigate = useNavigate();
  const createWorkspaceMutation = useCreateWorkspace();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (!isSlugCustomized) {
      setSlug(slugify(newName));
    }
    if (validationErrors.name) {
      setValidationErrors((prev) => ({ ...prev, name: null }));
    }
  };

  const handleSlugChange = (e) => {
    setIsSlugCustomized(true);
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
    if (validationErrors.slug) {
      setValidationErrors((prev) => ({ ...prev, slug: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Workspace name must be at least 2 characters long';
    }
    if (!slug.trim() || slug.trim().length < 2) {
      errors.slug = 'Workspace slug must be at least 2 characters long';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      errors.slug = 'Slug must only contain lowercase letters, numbers, and hyphens';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      await createWorkspaceMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Failed to create workspace. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {apiError && (
        <Alert type="error" title="Creation Failed">
          {apiError}
        </Alert>
      )}

      <div>
        <Input
          label="Workspace Name"
          id="workspace-name"
          placeholder="e.g. Acme Studio, Alpha Engineering"
          leftIcon={Building2}
          value={name}
          onChange={handleNameChange}
          error={validationErrors.name}
          helperText="The public display name for your team or organization."
          required
        />
      </div>

      <div>
        <Input
          label="Workspace URL Slug"
          id="workspace-slug"
          placeholder="e.g. acme-studio"
          leftIcon={Hash}
          value={slug}
          onChange={handleSlugChange}
          error={validationErrors.slug}
          helperText="Used in URLs: teamflow.app/workspaces/{slug}"
          required
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">Atomic Workspace Creation</p>
        <p>
          You will automatically be granted the <span className="font-semibold text-indigo-600">Owner</span> role.
          Owner membership is provisioned within an atomic transaction.
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/dashboard')}
          disabled={createWorkspaceMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={createWorkspaceMutation.isPending}
          leftIcon={Check}
        >
          Create Workspace
        </Button>
      </div>
    </form>
  );
};
