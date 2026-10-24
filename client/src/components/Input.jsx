import React from 'react';
import { cn } from '../lib/utils.js';

export const Input = React.forwardRef(
  (
    {
      label,
      id,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      containerClassName,
      required,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {LeftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LeftIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            className={cn(
              'block w-full h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600',
              LeftIcon && 'pl-9',
              RightIcon && 'pr-9',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <RightIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-600 font-medium mt-0.5" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
