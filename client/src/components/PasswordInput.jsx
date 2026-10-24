import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils.js';

export const PasswordInput = React.forwardRef(
  (
    {
      label,
      id,
      error,
      helperText,
      className,
      containerClassName,
      required,
      rightElement,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={cn('w-full flex flex-col gap-1.5', containerClassName)}>
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 tracking-wide">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {rightElement}
          </div>
        )}
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            required={required}
            className={cn(
              'block w-full h-10 rounded-lg border bg-white pl-9 pr-10 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
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

PasswordInput.displayName = 'PasswordInput';
