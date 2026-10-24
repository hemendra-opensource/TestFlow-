import React from 'react';
import { FolderKanban, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/Badge.jsx';

export const WorkspaceCard = ({ workspace }) => {
  const formattedDate = workspace.created_at
    ? new Date(workspace.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                {workspace.name}
              </h3>
              <p className="font-mono text-xs text-slate-500">/{workspace.slug}</p>
            </div>
          </div>
          <Badge variant={workspace.role || 'member'}>
            {workspace.role ? workspace.role.toUpperCase() : 'MEMBER'}
          </Badge>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {formattedDate}</span>
        </div>
        <div className="flex items-center gap-1 text-brand-600 font-medium group-hover:translate-x-0.5 transition-transform">
          <span>Active</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
};
