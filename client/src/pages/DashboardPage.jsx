import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, ShieldCheck, Layers, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { useWorkspaces } from '../features/workspaces/useWorkspaces.js';
import { WorkspaceList } from '../features/workspaces/WorkspaceList.jsx';
import { Button } from '../components/Button.jsx';

export const DashboardPage = () => {
  const { user, profile } = useAuth();
  const { data: workspaces, isLoading, error, refetch } = useWorkspaces();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Team Member';
  const totalWorkspaces = workspaces?.length || 0;
  const ownedWorkspaces = workspaces?.filter((w) => w.role === 'owner')?.length || 0;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-900 p-8 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-200 text-xs font-semibold mb-3 border border-brand-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 1: Foundation & Authentication</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-sm text-brand-100 max-w-xl leading-relaxed">
              Manage your isolated team workspaces with PostgreSQL Row Level Security (RLS) and verified session tokens.
            </p>
          </div>

          <div className="shrink-0">
            <Link to="/workspaces/new">
              <Button
                variant="primary"
                size="lg"
                leftIcon={Plus}
                className="bg-white text-brand-900 hover:bg-brand-50 shadow-md font-semibold focus:ring-white"
              >
                Create Workspace
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Workspaces</p>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : totalWorkspaces}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Owned by You</p>
              <p className="text-2xl font-bold text-slate-900">{isLoading ? '...' : ownedWorkspaces}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Security Isolation</p>
              <p className="text-sm font-bold text-emerald-600 mt-1">RLS Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Workspaces</h2>
            <p className="text-xs text-slate-500">Workspaces you have access to based on verified membership.</p>
          </div>
          <Link to="/workspaces/new">
            <Button variant="outline" size="sm" leftIcon={Plus}>
              New Workspace
            </Button>
          </Link>
        </div>

        <WorkspaceList
          workspaces={workspaces}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
        />
      </div>
    </div>
  );
};
