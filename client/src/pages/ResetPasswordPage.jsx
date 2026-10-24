import React from 'react';
import { ResetPasswordForm } from '../features/auth/ResetPasswordForm.jsx';

export const ResetPasswordPage = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Create new password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your new password below to regain account access.
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  );
};
