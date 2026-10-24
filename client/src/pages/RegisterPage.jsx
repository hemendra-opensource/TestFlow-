import React from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard.jsx';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';

export const RegisterPage = () => {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Join your team on TeamFlow to manage projects, tasks, and workspaces."
      footer={
        <p className="text-xs text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Sign In
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
};
