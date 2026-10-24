import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  Plus,
  ChevronDown,
  Building2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { useWorkspaces } from '../features/workspaces/useWorkspaces.js';
import { cn } from '../lib/utils.js';
import { Badge } from './Badge.jsx';

export const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { data: workspaces } = useWorkspaces();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  // Active workspace (either selected or first available)
  const currentWorkspace = selectedWorkspace || (workspaces && workspaces[0]) || null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/dashboard',
      enabled: true,
    },
    {
      name: 'Workspaces',
      path: '/workspaces/new',
      icon: Building2,
      active: location.pathname === '/workspaces/new',
      enabled: true,
    },
    {
      name: 'My Tasks',
      path: '#',
      icon: CheckSquare,
      active: false,
      enabled: false,
      badge: 'Phase 2',
    },
    {
      name: 'Projects',
      path: '#',
      icon: FolderKanban,
      active: false,
      enabled: false,
      badge: 'Phase 2',
    },
    {
      name: 'Team Members',
      path: '#',
      icon: Users,
      active: false,
      enabled: false,
      badge: 'Phase 2',
    },
    {
      name: 'Analytics',
      path: '#',
      icon: BarChart3,
      active: false,
      enabled: false,
      badge: 'Phase 2',
    },
    {
      name: 'Settings & Profile',
      path: '/settings/profile',
      icon: Settings,
      active: location.pathname === '/settings/profile',
      enabled: true,
    },
  ];

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <Link
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2.5 group transition-transform"
        >
          <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
              Team<span className="text-brand-600">Flow</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Workspace Selector Dropdown */}
      <div className="px-3.5 py-3 border-b border-slate-100 relative">
        <button
          type="button"
          onClick={() => setWorkspaceMenuOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-md bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
              {currentWorkspace ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                {currentWorkspace ? currentWorkspace.name : 'Select Workspace'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {currentWorkspace ? `/${currentWorkspace.slug}` : 'No workspace'}
              </p>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
        </button>

        {/* Workspace Menu Popover */}
        {workspaceMenuOpen && (
          <div
            className="absolute left-3.5 right-3.5 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-xs"
            onClick={() => setWorkspaceMenuOpen(false)}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Your Workspaces
            </div>

            <div className="max-h-48 overflow-y-auto">
              {workspaces && workspaces.length > 0 ? (
                workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setSelectedWorkspace(ws)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors',
                      currentWorkspace?.id === ws.id && 'bg-brand-50/60 font-semibold text-brand-700'
                    )}
                  >
                    <div className="truncate">
                      <div className="truncate text-slate-800">{ws.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">/{ws.slug}</div>
                    </div>
                    {ws.role && (
                      <Badge variant={ws.role} size="xs">
                        {ws.role}
                      </Badge>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-slate-400 text-center">No workspaces found</div>
              )}
            </div>

            <div className="border-t border-slate-100 mt-1 pt-1">
              <Link
                to="/workspaces/new"
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 text-brand-600 hover:bg-brand-50/50 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Workspace</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Platform
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <div
                key={item.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed select-none group"
                title={`${item.name} will be introduced in Phase 2`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-300" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200/50">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                item.active
                  ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-100/80 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn('w-4 h-4', item.active ? 'text-brand-600' : 'text-slate-400')}
                />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Phase 1 Badge Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="rounded-lg bg-white p-3 border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-1.5 text-brand-700 text-[11px] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Active</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Foundation, authentication, and atomic workspace isolation.
          </p>
        </div>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to="/settings/profile"
          onClick={onClose}
          className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center border border-brand-200/80 shrink-0">
              {initial}
            </div>
          )}
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-900 truncate leading-none mb-0.5">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
