import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth.js';
import { Spinner } from '../components/Spinner.jsx';

export const PublicRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Spinner size="lg" className="text-brand-600 mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Initializing authentication...
        </p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
