import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Users,
  Shield,
  Crown,
  Eye,
  User,
  Hash,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  Calendar,
  FolderKanban,
} from 'lucide-react';
import { useWorkspace, useWorkspaceMembers, useUpdateWorkspace } from '../features/workspaces/useWorkspaces.js';
import { useProjects, useCreateProject } from '../features/projects/useProjects.js';
import { ProjectCard } from '../features/projects/ProjectCard.jsx';
import { ProjectModal } from '../features/projects/ProjectModal.jsx';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import { Alert } from '../components/Alert.jsx';
import { Badge } from '../components/Badge.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { useAuth } from '../features/auth/useAuth.js';

// ── Role icon helper ──────────────────────────────────────
const RoleIcon = ({ role, className = 'h-4 w-4' }) => {
  switch (role) {
    case 'owner': return <Crown className={className} />;
    case 'admin': return <Shield className={className} />;
    case 'viewer': return <Eye className={className} />;
    default: return <User className={className} />;
  }
};

const ROLE_COLORS = {
  owner: 'text-amber-600 bg-amber-50 ring-amber-200',
  admin: 'text-blue-600 bg-blue-50 ring-blue-200',
  member: 'text-green-600 bg-green-50 ring-green-200',
  viewer: 'text-slate-600 bg-slate-50 ring-slate-200',
};

// ── Member row ────────────────────────────────────────────
const MemberRow = ({ member, index }) => {
  const initials = member.full_name
    ? member.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const roleColor = ROLE_COLORS[member.role] || ROLE_COLORS.member;

  return (
    <div
      className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 animate-fadeIn"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name || 'Member'}
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm flex-shrink-0">
          {initials}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {member.full_name || 'Unknown User'}
        </p>
        <p className="text-xs text-slate-500 truncate">
          Joined {new Date(member.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${roleColor}`}>
        <RoleIcon role={member.role} className="h-3 w-3" />
        <span className="capitalize">{member.role}</span>
      </div>
    </div>
  );
};

// ── Edit form for workspace settings ─────────────────────
const WorkspaceSettingsPanel = ({ workspace, onClose }) => {
  const { user } = useAuth();
  const isOwner = workspace.role === 'owner';
  const updateMutation = useUpdateWorkspace(workspace.id);

  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [description, setDescription] = useState(workspace.description || '');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (slug && (slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      e.slug = 'Slug must be lowercase letters, numbers, and hyphens only';
    }
    if (description.length > 500) e.description = 'Description cannot exceed 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSaved(false);
    if (!validate()) return;

    const updates = {};
    if (name.trim() !== workspace.name) updates.name = name.trim();
    if (description.trim() !== (workspace.description || '')) updates.description = description.trim() || null;
    if (isOwner && slug.trim() !== workspace.slug) updates.slug = slug.trim();

    if (Object.keys(updates).length === 0) {
      setSaved(true);
      return;
    }

    try {
      await updateMutation.mutateAsync(updates);
      setSaved(true);
    } catch (err) {
      setApiError(err.message || 'Failed to update workspace');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">Workspace Settings</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close settings panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {saved && !apiError && (
        <Alert type="success" title="Saved" className="mb-4">
          Workspace settings updated successfully.
        </Alert>
      )}

      {apiError && (
        <Alert type="error" title="Update Failed" className="mb-4">
          {apiError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="ws-name"
          label="Workspace Name"
          leftIcon={FolderKanban}
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })); }}
          error={errors.name}
          required
        />

        {isOwner && (
          <Input
            id="ws-slug"
            label="URL Slug (owner only)"
            leftIcon={Hash}
            value={slug}
            onChange={(e) => { setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); setErrors((p) => ({ ...p, slug: null })); }}
            helperText="Changing the slug will update all workspace URLs."
            error={errors.slug}
          />
        )}

        <div>
          <label htmlFor="ws-description" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="ws-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe this workspace's purpose..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          <p className="mt-1 text-xs text-slate-400">{description.length}/500 characters</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            leftIcon={saved ? Check : null}
            isLoading={updateMutation.isPending}
            size="sm"
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

// ── Main WorkspaceDetailPage ──────────────────────────────
export const WorkspaceDetailPage = () => {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const { data: workspace, isLoading: wsLoading, error: wsError } = useWorkspace(workspaceId);
  const { data: members, isLoading: membersLoading, error: membersError } = useWorkspaceMembers(workspaceId);
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useProjects(workspaceId);
  const createProjectMutation = useCreateProject(workspaceId);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const isAdmin = workspace?.role === 'admin' || workspace?.role === 'owner';

  // ── Loading state ──
  if (wsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Spinner size="lg" className="text-brand-600 mb-4" />
        <p className="text-sm font-medium">Loading workspace...</p>
      </div>
    );
  }

  // ── Error state ──
  if (wsError) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Workspace Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          {wsError.status === 404
            ? "This workspace doesn't exist or you don't have access to it."
            : wsError.message}
        </p>
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={ArrowLeft}>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!workspace) return null;

  const formattedCreated = workspace.created_at
    ? new Date(workspace.created_at).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/dashboard" className="hover:text-slate-800 transition-colors font-medium">
          Workspaces
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-800 font-semibold truncate">{workspace.name}</span>
      </div>

      {/* ── Header card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-br from-brand-500 via-brand-600 to-violet-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-brand-600 ring-1 ring-brand-100">
              <FolderKanban className="h-9 w-9" />
            </div>

            <div className="flex items-center gap-2 mt-10">
              <Badge variant={workspace.role || 'member'}>
                <RoleIcon role={workspace.role} className="h-3 w-3 mr-1" />
                {(workspace.role || 'member').toUpperCase()}
              </Badge>

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Settings}
                  onClick={() => setShowSettings((s) => !s)}
                >
                  {showSettings ? 'Close Settings' : 'Settings'}
                </Button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{workspace.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm text-slate-400">/{workspace.slug}</span>
          </div>

          {workspace.description && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-2xl">
              {workspace.description}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>Created {formattedCreated}</span>
          </div>
        </div>
      </div>

      {/* ── Settings panel (inline, toggle) ── */}
      {showSettings && isAdmin && (
        <WorkspaceSettingsPanel
          workspace={workspace}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Projects section ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Projects</h2>
            <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {projects.length}
            </span>
          </div>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => setIsProjectModalOpen(true)}
            >
              New Project
            </Button>
          )}
        </div>

        <div className="p-6">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span className="text-sm">Loading projects...</span>
            </div>
          ) : projectsError ? (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-7 w-7 text-red-400 mb-2" />
              <p className="text-sm text-red-700">{projectsError.message}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 p-6">
              <FolderKanban className="mx-auto h-10 w-10 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No Projects Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Create projects in this workspace to manage tasks, milestones, and your real-time Kanban board.
              </p>
              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={Plus}
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <ProjectCard key={proj.id} project={proj} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Creation Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={async (projectData) => {
          await createProjectMutation.mutateAsync(projectData);
        }}
        isSubmitting={createProjectMutation.isPending}
      />

      {/* ── Members panel ── */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Members</h2>
            {members && (
              <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {members.length}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 italic">
            {!isAdmin && 'Contact an admin to manage members'}
            {isAdmin && 'Invitation flow available in Phase 3'}
          </div>
        </div>

        <div className="px-6 py-2">
          {membersLoading && (
            <div className="flex items-center justify-center py-10 gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span className="text-sm">Loading members...</span>
            </div>
          )}

          {membersError && (
            <div className="py-8 text-center">
              <AlertCircle className="mx-auto h-7 w-7 text-red-400 mb-2" />
              <p className="text-sm text-red-700">{membersError.message}</p>
            </div>
          )}

          {!membersLoading && !membersError && members && members.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              <Users className="mx-auto h-8 w-8 mb-2 text-slate-300" />
              <p className="text-sm">No members found.</p>
            </div>
          )}

          {!membersLoading && !membersError && members && members.map((member, i) => (
            <MemberRow key={member.id || member.user_id} member={member} index={i} />
          ))}
        </div>
      </div>

      {/* ── Back link ── */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to all workspaces</span>
      </Link>
    </div>
  );
};
