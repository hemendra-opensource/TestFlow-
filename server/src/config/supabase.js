import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let defaultClient = null;
let scopedClientFactory = null;

export const getSupabaseClient = () => {
  if (!defaultClient) {
    const url = config.supabase.url || 'https://placeholder.supabase.co';
    const key = config.supabase.publishableKey || 'placeholder-anon-key';
    defaultClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return defaultClient;
};

/**
 * Creates a scoped Supabase client with the authenticated user's access token.
 * This guarantees that database queries enforce PostgreSQL Row Level Security (RLS)
 * and auth.uid() reflects the authenticated user.
 */
export const createScopedClient = (accessToken) => {
  if (scopedClientFactory) {
    return scopedClientFactory(accessToken);
  }

  const url = config.supabase.url || 'https://placeholder.supabase.co';
  const key = config.supabase.publishableKey || 'placeholder-anon-key';

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

// For test dependency injection
export const setSupabaseClientForTesting = (mockClient) => {
  defaultClient = mockClient;
};

export const setScopedClientFactoryForTesting = (factoryFn) => {
  scopedClientFactory = factoryFn;
};
