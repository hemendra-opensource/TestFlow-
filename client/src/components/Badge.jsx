import React from 'react';
import { cn } from '../lib/utils.js';

export const Badge = ({ children, variant = 'default', size = 'sm', className }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    owner: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/10',
    admin: 'bg-purple-50 text-purple-700 border-purple-200 ring-1 ring-purple-500/10',
    member: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10',
    viewer: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10',
  };

  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 uppercase tracking-wider font-bold',
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border',
        variants[variant] || variants.default,
        sizes[size] || sizes.sm,
        className
      )}
    >
      {children}
    </span>
  );
};
