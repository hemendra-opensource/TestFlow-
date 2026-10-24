import React from 'react';
import { RegisterForm } from '../features/auth/RegisterForm.jsx';

export const RegisterPage = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Create your account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Get started with TeamFlow in seconds.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
};
