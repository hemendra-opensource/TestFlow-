/**
 * Re-export the shared Supabase client to support both
 * `client/src/lib/supabase.js` and `client/src/lib/supabaseClient.js` imports.
 */
export * from './supabase.js';
export { supabase as default } from './supabase.js';
