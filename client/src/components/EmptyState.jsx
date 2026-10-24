import React from 'react';
import { cn } from '../lib/utils.js';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  actionTo,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-slate-200/90 bg-white/70 p-10 text-center flex flex-col items-center justify-center',
        className
      )}
    >
      {Icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50/80 text-brand-600 ring-1 ring-brand-500/10 mb-4">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel && (onAction || actionTo)) && (
        <div className="mt-5">
          {actionTo ? (
            <a href={actionTo}>
              <Button variant="primary" size="sm" leftIcon={actionIcon}>
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button variant="primary" size="sm" leftIcon={actionIcon} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
