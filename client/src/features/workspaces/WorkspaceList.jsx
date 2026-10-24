import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderPlus, AlertCircle } from 'lucide-react';
import { WorkspaceCard } from './WorkspaceCard.jsx';
import { Button } from '../../components/Button.jsx';
import { Spinner } from '../../components/Spinner.jsx';

export const WorkspaceList = ({ workspaces, isLoading, error, refetch }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <Spinner size="lg" className="text-brand-600 mb-3" />
        <p className="text-sm font-medium">Loading your authorized workspaces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <h3 className="text-sm font-semibold text-red-900">Failed to load workspaces</h3>
        <p className="mt-1 text-xs text-red-700">{error.message || 'An error occurred while fetching workspaces.'}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 border-red-300 text-red-700 hover:bg-red-100">
          Try Again
        </Button>
      </div>
    );
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white/60">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <FolderPlus className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">No workspaces found</h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto">
          You don't have access to any workspaces yet. Create your first workspace to start collaborating.
        </p>
        <div className="mt-6">
          <Link to="/workspaces/new">
            <Button leftIcon={Plus} variant="primary">
              Create New Workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
};
