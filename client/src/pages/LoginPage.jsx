import React from 'react';
import { LoginForm } from '../features/auth/LoginForm.jsx';

export const LoginPage = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sign in to access your workspaces and team projects.
        </p>
      </div>
      <LoginForm />
    </div>
  );
};
