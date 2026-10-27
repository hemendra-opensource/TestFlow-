import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, Home, Layers } from 'lucide-react';
import { Button } from './Button.jsx';

export function RouteErrorBoundary() {
  const error = useRouteError();

  const errorMessage =
    error?.statusText ||
    error?.message ||
    (typeof error === 'string' ? error : 'An unexpected error occurred while loading this view.');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 text-center animate-fadeIn">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="inline-flex p-3 rounded-full bg-rose-50 text-rose-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {errorMessage}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="primary"
            leftIcon={RefreshCw}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>

          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              leftIcon={Home}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
