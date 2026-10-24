import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validates that the Supabase URL is well-formed and not a placeholder.
 */
export function isValidSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (
    trimmed.includes('your-project') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('example.com') ||
    trimmed.includes('<') ||
    trimmed.includes('>')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Validates that the publishable/anon key is present, of expected length, and not a placeholder.
 */
export function isValidSupabaseKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (
    trimmed.includes('your-anon-key') ||
    trimmed.includes('your-publishable-key') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('your-') ||
    trimmed.length < 20
  ) {
    return false;
  }
  return true;
}

/**
 * Boolean flag indicating whether valid, non-placeholder Supabase credentials are configured.
 */
export const isSupabaseConfigured = Boolean(
  isValidSupabaseUrl(rawUrl) && isValidSupabaseKey(rawKey)
);

function createFallbackClient() {
  const notConfiguredError = () =>
    new Error('Supabase is not configured. Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in client/.env');

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signUp: async () => { throw notConfiguredError(); },
      signInWithPassword: async () => { throw notConfiguredError(); },
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => { throw notConfiguredError(); },
      updateUser: async () => { throw notConfiguredError(); },
    },
    from: () => {
      throw notConfiguredError();
    },
  };
}

// Single initialized instance
export const supabase = isSupabaseConfigured
  ? createClient(rawUrl.trim(), rawKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : createFallbackClient();

export default supabase;
