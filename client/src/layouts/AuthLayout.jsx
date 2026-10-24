import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layers, ShieldCheck, Zap, Database } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { Alert } from '../components/Alert.jsx';

export const AuthLayout = () => {
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-gradient-to-b from-brand-100/60 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30 group-hover:scale-105 transition-transform">
            <Layers className="h-6 w-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            Team<span className="text-brand-600">Flow</span>
          </span>
        </Link>
        <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-widest">
          Phase 1: Foundation & Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {!isConfigured && (
          <div className="mb-6">
            <Alert type="warning" title="Supabase Credentials Needed">
              Supabase environment variables are currently using placeholder values. Ensure
              <code className="mx-1 px-1 py-0.5 bg-amber-100 rounded text-[11px]">.env</code> is populated with your active Supabase URL and Key for live auth.
            </Alert>
          </div>
        )}

        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-900/5 sm:rounded-2xl border border-slate-200/80 sm:px-10">
          <Outlet />
        </div>

        {/* Feature badges footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> PostgreSQL RLS
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand-500" /> Supabase Auth
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Database className="w-4 h-4 text-indigo-500" /> Atomic Isolation
          </span>
        </div>
      </div>
    </div>
  );
};
