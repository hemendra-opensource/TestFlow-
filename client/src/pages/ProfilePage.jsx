import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, CheckCircle2, Image as ImageIcon, Key } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';
import { Alert } from '../components/Alert.jsx';

export const ProfilePage = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (avatarUrl && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://')) {
      setError('Avatar URL must start with http:// or https://');
      return;
    }

    try {
      setIsUpdating(true);
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      setSuccessMessage('Profile details updated successfully');
      await refreshProfile();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const initial = (fullName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Settings</h1>
        <p className="text-xs text-slate-500">Manage your profile information and verified account details.</p>
      </div>

      {successMessage && (
        <Alert type="success" title="Success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert type="error" title="Update Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || 'Avatar'}
              className="h-16 w-16 rounded-full object-cover border-2 border-brand-200 shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-700 font-extrabold text-xl flex items-center justify-center border-2 border-brand-200 shadow-sm">
              {initial}
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900">{fullName || 'No display name'}</h2>
            <p className="text-xs font-mono text-slate-500">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                <Shield className="w-3 h-3" />
                Verified Supabase Auth
              </span>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Input
            label="Display Full Name"
            id="profile-fullname"
            placeholder="e.g. Alex Morgan"
            leftIcon={User}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            helperText="Your name visible to workspace members."
          />

          <Input
            label="Avatar Image URL"
            id="profile-avatar"
            placeholder="https://example.com/photo.jpg"
            leftIcon={ImageIcon}
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            helperText="Direct image link (HTTPS) for your profile picture."
          />

          {/* Read-Only Identity Fields */}
          <div className="pt-2">
            <Input
              label="Email Address (Managed by Supabase Auth)"
              id="profile-email"
              type="email"
              leftIcon={Mail}
              value={user?.email || ''}
              disabled
              className="bg-slate-50 text-slate-500 cursor-not-allowed"
              helperText="Email changes require identity verification through Supabase Auth."
            />
          </div>

          <div className="pt-2">
            <Input
              label="User UUID (Database Primary Key)"
              id="profile-id"
              leftIcon={Key}
              value={user?.id || ''}
              disabled
              className="bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed"
              helperText="References auth.users(id) with Row Level Security."
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              leftIcon={Save}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
