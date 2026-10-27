import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, AlertCircle, CheckCircle2, User, Loader2 } from 'lucide-react';
import { useAddWorkspaceMember, useRegisteredUsers } from './useWorkspaces.js';
import { Button } from '../../components/Button.jsx';
import { Alert } from '../../components/Alert.jsx';

export function AddMemberModal({ isOpen, onClose, workspaceId, existingMembers = [] }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [apiError, setApiError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const addMemberMutation = useAddWorkspaceMember(workspaceId);
  const { data: registeredUsers = [], isLoading: loadingUsers } = useRegisteredUsers();

  if (!isOpen) return null;

  // Filter out users who are already members
  const existingUserIds = new Set(existingMembers.map((m) => m.user_id));
  const availableUsers = registeredUsers.filter((u) => !existingUserIds.has(u.id));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setApiError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setApiError('Please enter a user email address.');
      return;
    }

    try {
      await addMemberMutation.mutateAsync({ email: cleanEmail, role });
      setSuccessMsg(`Successfully added ${cleanEmail} to the workspace!`);
      setEmail('');
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err) {
      setApiError(err.message || 'Failed to add member to workspace.');
    }
  };

  const handleSelectQuickUser = (userEmail) => {
    setEmail(userEmail);
    setApiError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Team Member</h3>
              <p className="text-[11px] text-slate-500">Invite or assign a user to this workspace & projects</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && (
            <Alert variant="danger" title="Error" icon={AlertCircle}>
              {apiError}
            </Alert>
          )}

          {successMsg && (
            <Alert variant="success" title="Success" icon={CheckCircle2}>
              {successMsg}
            </Alert>
          )}

          {/* Email input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              User Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              />
            </div>
          </div>

          {/* Quick pick from registered users */}
          {availableUsers.length > 0 && (
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Quick Add Registered Team Member:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-lg border border-slate-100 bg-slate-50/60">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickUser(u.email)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      email.toLowerCase() === u.email.toLowerCase()
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>{u.full_name || u.email.split('@')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Workspace Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'member', label: 'Member', desc: 'Can create & edit tasks' },
                { value: 'admin', label: 'Admin', desc: 'Full project management' },
                { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    role === r.value
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{r.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={UserPlus}
              disabled={addMemberMutation.isPending || !email.trim()}
            >
              {addMemberMutation.isPending ? 'Adding Member...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AddMemberModal;
