import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../features/auth/useAuth.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

export const SupabaseNotice = () => {
  const auth = useAuth();
  // Ensure we check configuration from either context or client module directly
  const isConfigured = auth?.isConfigured ?? isSupabaseConfigured;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  // When credentials are genuinely valid and non-placeholder, the warning does not render.
  if (isConfigured || isDismissed) {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full mb-6">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 shadow-xs transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-950">Development Notice:</span>
            <span className="text-amber-800 hidden sm:inline">Supabase credentials pending in .env</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded hover:bg-amber-100/60 transition-colors"
            >
              <span>{isExpanded ? 'Hide' : 'Setup Steps'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss warning"
              className="p-1 rounded text-amber-600 hover:text-amber-950 hover:bg-amber-100/60 transition-colors"
              title="Dismiss warning for this session"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 space-y-2 text-amber-800">
            <p>
              To enable live authentication, configure your Supabase project keys in <code className="px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-900 font-mono text-[11px]">client/.env</code>:
            </p>
            <div className="relative rounded-lg bg-amber-900/10 p-2 font-mono text-[11px] text-amber-950 flex items-center justify-between">
              <div>
                <div>VITE_SUPABASE_URL=https://your-project.supabase.co</div>
                <div>VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key</div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded hover:bg-amber-200/50 text-amber-900 transition-colors"
                title="Copy template"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-amber-700">
              Find these in your <strong>Supabase Dashboard &rarr; Project Settings &rarr; API</strong>. Restart the Vite server after editing <code className="font-mono">.env</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
