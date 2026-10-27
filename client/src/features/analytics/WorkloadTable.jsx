import React from 'react';
import { Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../../components/Badge.jsx';

export function WorkloadTable({ data = {}, isLoading = false }) {
  const members = data.members || [];
  const unassigned = data.unassigned || {
    total_assigned: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between p-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-800">Team Workload Distribution</h3>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {members.length} team {members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-10 bg-slate-100 rounded w-full"></div>
          <div className="h-10 bg-slate-100 rounded w-full"></div>
          <div className="h-10 bg-slate-100 rounded w-full"></div>
        </div>
      ) : members.length === 0 && unassigned.total_assigned === 0 ? (
        <div className="p-8 text-center">
          <p className="text-xs font-semibold text-slate-600">No workload data found</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Assign tasks to team members to see their workload distribution
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/60 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Total Tasks</th>
                <th className="py-3 px-4 text-center">In Progress</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Overdue</th>
                <th className="py-3 px-4 w-44">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {members.map((member) => {
                const initial = (member.full_name || member.email || 'U').charAt(0).toUpperCase();
                return (
                  <tr key={member.user_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt={member.full_name || member.email}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200">
                            {initial}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">
                            {member.full_name || member.email?.split('@')[0]}
                          </div>
                          <div className="text-[11px] text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {member.total_assigned}
                    </td>
                    <td className="py-3 px-4 text-center text-blue-600 font-semibold">
                      {member.in_progress}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                      {member.completed}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {member.overdue > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {member.overdue} overdue
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${member.completion_rate}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 w-8 text-right">
                          {member.completion_rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Unassigned row if any exist */}
              {unassigned.total_assigned > 0 && (
                <tr className="bg-slate-50/40 hover:bg-slate-50 transition-colors italic text-slate-600">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                        ?
                      </div>
                      <div>
                        <div className="font-semibold text-slate-700 not-italic">Unassigned</div>
                        <div className="text-[11px] text-slate-400 not-italic">No owner assigned</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800 not-italic">
                    {unassigned.total_assigned}
                  </td>
                  <td className="py-3 px-4 text-center text-blue-600 font-semibold not-italic">
                    {unassigned.in_progress}
                  </td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-semibold not-italic">
                    {unassigned.completed}
                  </td>
                  <td className="py-3 px-4 text-center not-italic">
                    {unassigned.overdue > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        {unassigned.overdue} overdue
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 not-italic">
                    <span className="text-[11px] text-slate-400">—</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
