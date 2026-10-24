import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { CreateWorkspaceForm } from '../features/workspaces/CreateWorkspaceForm.jsx';

export const NewWorkspacePage = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspaces</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="h-12 w-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center ring-1 ring-brand-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create a New Workspace</h1>
            <p className="text-xs text-slate-500">
              Workspaces isolate your team's projects, members, and data permissions.
            </p>
          </div>
        </div>

        <CreateWorkspaceForm />
      </div>
    </div>
  );
};
