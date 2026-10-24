import React from 'react';
import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard.jsx';
import { ResetPasswordForm } from '../features/auth/ResetPasswordForm.jsx';

export const ResetPasswordPage = () => {
  return (
    <AuthCard
      title="Create new password"
      subtitle="Choose a strong, secure password for your account."
      footer={
        <Link
          to="/login"
          className="text-xs font-semibold text-slate-600 hover:text-brand-600 hover:underline"
        >
          Return to Sign In
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
};
