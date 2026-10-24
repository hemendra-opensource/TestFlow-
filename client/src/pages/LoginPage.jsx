import React from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard.jsx';
import { LoginForm } from '../features/auth/LoginForm.jsx';

export const LoginPage = () => {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your account to manage workspaces and collaborate with your team."
      footer={
        <p className="text-xs text-slate-600">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
};
