import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuthCard } from '../components/AuthCard.jsx';
import { ForgotPasswordForm } from '../features/auth/ForgotPasswordForm.jsx';

export const ForgotPasswordPage = () => {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your verified account email to receive a password recovery link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
};
