import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ShieldCheck, Key, Lock } from 'lucide-react';
import { SupabaseNotice } from './SupabaseNotice.jsx';

export const AuthCard = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Configuration warning if Supabase credentials are missing */}
      <SupabaseNotice />

      {/* Main Authentication Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-900/[0.04] p-7 sm:p-9 transition-all">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/25 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Team<span className="text-brand-600">Flow</span>
            </span>
          </Link>

          {/* Contextual Subtitle */}
          <div className="block">
            <span className="inline-block text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60">
              Workspace Management
            </span>
          </div>

          {/* Page Title & Subtitle */}
          {title && (
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-4">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Card Form Body */}
        <div>{children}</div>

        {/* Optional Footer Link Inside Card */}
        {footer && <div className="mt-6 pt-5 border-t border-slate-100 text-center">{footer}</div>}
      </div>

      {/* Security Trust Badges Beneath Card */}
      <div className="mt-6 flex items-center justify-center gap-5 text-[11px] font-medium text-slate-400">
        <span className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>PostgreSQL RLS</span>
        </span>
        <span className="text-slate-300">&bull;</span>
        <span className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors">
          <Key className="w-3.5 h-3.5 text-brand-500" />
          <span>Supabase Auth</span>
        </span>
        <span className="text-slate-300">&bull;</span>
        <span className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors">
          <Lock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Session Guard</span>
        </span>
      </div>
    </div>
  );
};
