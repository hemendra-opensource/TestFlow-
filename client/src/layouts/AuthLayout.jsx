import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Subtle background ambient gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/60 via-transparent to-transparent pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="flex-1 flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
};
