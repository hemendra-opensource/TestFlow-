import React from 'react';
import {
  Activity,
  PlusCircle,
  UserCheck,
  RefreshCw,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useWorkspaceActivity } from './useActivity.js';
import { cn } from '../../lib/utils.js';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function renderActionText(item) {
  const meta = item.metadata || {};
  const taskTitle = meta.task_title || 'a task';

  switch (item.action) {
    case 'created':
      return (
        <span>
          created task <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
        </span>
      );
    case 'assigned':
      return (
        <span>
          assigned task <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
        </span>
      );
    case 'status_changed':
      return (
        <span>
          moved <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
          {meta.to && (
            <span>
              {' '}to <span className="capitalize font-semibold text-brand-600">{meta.to.replace('_', ' ')}</span>
            </span>
          )}
        </span>
      );
    case 'commented':
      return (
        <span>
          commented on <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
        </span>
      );
    case 'deleted':
      return (
        <span>
          deleted task <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
        </span>
      );
    case 'deleted_comment':
      return (
        <span>
          removed a comment on <strong className="text-slate-900 font-medium">"{taskTitle}"</strong>
        </span>
      );
    default:
      return <span>performed an action on {item.entity_type}</span>;
  }
}

function getActionIcon(action) {
  switch (action) {
    case 'created':
      return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
    case 'assigned':
      return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
    case 'status_changed':
      return <RefreshCw className="w-3.5 h-3.5 text-amber-600" />;
    case 'commented':
      return <MessageSquare className="w-3.5 h-3.5 text-blue-600" />;
    case 'deleted':
    case 'deleted_comment':
      return <Trash2 className="w-3.5 h-3.5 text-rose-500" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  }
}

export function ActivityFeed({ workspaceId }) {
  const { data: logs = [], isLoading, error } = useWorkspaceActivity(workspaceId);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">Activity History</h2>
          {logs && logs.length > 0 && (
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {logs.length}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">Recent team updates</span>
      </div>

      {/* Body */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-slate-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading activity feed...</span>
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-600 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error.message || 'Failed to load activity logs.'}</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 p-6">
            <Activity className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No recent activity</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Actions taken on projects, tasks, and comments will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {logs.map((item, idx) => {
              const actorName = item.actor?.full_name || 'Team member';
              const initial = actorName.charAt(0).toUpperCase();

              return (
                <div key={item.id || idx} className="flex items-start gap-3 text-xs text-slate-600">
                  {/* Actor Avatar */}
                  {item.actor?.avatar_url ? (
                    <img
                      src={item.actor.avatar_url}
                      alt={actorName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 mt-0.5"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-200 mt-0.5">
                      {initial}
                    </div>
                  )}

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug">
                      <span className="font-semibold text-slate-900 mr-1">{actorName}</span>
                      {renderActionText(item)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      {getActionIcon(item.action)}
                      <span>{formatTimestamp(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
