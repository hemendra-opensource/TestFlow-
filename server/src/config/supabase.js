import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from './env.js';

let defaultClient = null;
let scopedClientFactory = null;

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: ws,
  },
};

export const getSupabaseClient = () => {
  if (!defaultClient) {
    const url = config.supabase.url || 'https://placeholder.supabase.co';
    const key = config.supabase.publishableKey || 'placeholder-anon-key';
    defaultClient = createClient(url, key, clientOptions);
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
    realtime: {
      transport: ws,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

let adminClient = null;

export const getSupabaseAdminClient = () => {
  if (!adminClient) {
    const url = config.supabase.url || 'https://placeholder.supabase.co';
    const key = config.supabase.secretKey || config.supabase.publishableKey || 'placeholder-anon-key';
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        transport: ws,
      },
    });
  }
  return adminClient;
};

// For test dependency injection
export const setSupabaseClientForTesting = (mockClient) => {
  defaultClient = mockClient;
};

export const setScopedClientFactoryForTesting = (factoryFn) => {
  scopedClientFactory = factoryFn;
};

export const setAdminClientForTesting = (mockAdmin) => {
  adminClient = mockAdmin;
};
