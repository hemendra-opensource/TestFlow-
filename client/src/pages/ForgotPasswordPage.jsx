import React from 'react';
import { ForgotPasswordForm } from '../features/auth/ForgotPasswordForm.jsx';

export const ForgotPasswordPage = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Reset password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your email to receive recovery instructions.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
};
