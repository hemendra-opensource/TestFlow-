import { createApp } from '../../src/app.js';
import { setSupabaseClientForTesting, setScopedClientFactoryForTesting } from '../../src/config/supabase.js';

export const TEST_USERS = {
  alice: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'alice@example.com',
    user_metadata: { full_name: 'Alice Cooper', avatar_url: 'https://example.com/alice.png' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  bob: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'bob@example.com',
    user_metadata: { full_name: 'Bob Marley', avatar_url: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const VALID_TOKENS = {
  alice: 'valid-alice-token',
  bob: 'valid-bob-token',
};

/**
 * Creates an in-memory isolated database state simulating Supabase PostgreSQL with RLS
 */
export const createMockSupabaseEnvironment = () => {
  // Database in-memory tables
  const db = {
    profiles: [
      {
        id: TEST_USERS.alice.id,
        full_name: 'Alice Cooper',
        avatar_url: 'https://example.com/alice.png',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: TEST_USERS.bob.id,
        full_name: 'Bob Marley',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    workspaces: [
      {
        id: 'ws-alice-1',
        name: "Alice's Workspace",
        slug: 'alice-workspace',
        created_by: TEST_USERS.alice.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    workspace_members: [
      {
        workspace_id: 'ws-alice-1',
        user_id: TEST_USERS.alice.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
    ],
  };

  const getClientForToken = (token) => {
    let currentUser = null;
    if (token === VALID_TOKENS.alice) {
      currentUser = TEST_USERS.alice;
    } else if (token === VALID_TOKENS.bob) {
      currentUser = TEST_USERS.bob;
    }

    return {
      auth: {
        getUser: async (tok) => {
          if (tok === VALID_TOKENS.alice) {
            return { data: { user: TEST_USERS.alice }, error: null };
          }
          if (tok === VALID_TOKENS.bob) {
            return { data: { user: TEST_USERS.bob }, error: null };
          }
          return { data: { user: null }, error: new Error('Invalid or expired token') };
        },
      },
      from: (table) => {
        let filterEq = {};
        return {
          select: (fields) => {
            return {
              eq: (col, val) => {
                filterEq[col] = val;
                return {
                  maybeSingle: async () => {
                    if (table === 'profiles') {
                      // RLS check: auth.uid() = id
                      if (currentUser && currentUser.id !== val) {
                        return { data: null, error: null }; // RLS hides other users' profile
                      }
                      const match = db.profiles.find((p) => p[col] === val);
                      return { data: match || null, error: null };
                    }
                    return { data: null, error: null };
                  },
                  single: async () => {
                    const match = db[table]?.find((row) => row[col] === val);
                    return { data: match || null, error: match ? null : new Error('Not found') };
                  },
                  order: (orderCol, { ascending } = {}) => {
                    if (table === 'workspace_members') {
                      // RLS check: only returns records for workspaces the user is a member of
                      const userMemberships = db.workspace_members.filter((m) => {
                        return m.user_id === currentUser?.id;
                      });
                      const results = userMemberships.map((m) => {
                        const ws = db.workspaces.find((w) => w.id === m.workspace_id);
                        return {
                          role: m.role,
                          joined_at: m.joined_at,
                          workspace: ws || null,
                        };
                      });
                      return Promise.resolve({ data: results, error: null });
                    }
                    return Promise.resolve({ data: [], error: null });
                  },
                };
              },
            };
          },
          update: (payload) => {
            return {
              eq: (col, val) => {
                return {
                  select: () => ({
                    single: async () => {
                      if (table === 'profiles') {
                        if (currentUser && currentUser.id !== val) {
                          return { data: null, error: { message: 'RLS permission denied', code: '42501' } };
                        }
                        const idx = db.profiles.findIndex((p) => p[col] === val);
                        if (idx !== -1) {
                          db.profiles[idx] = { ...db.profiles[idx], ...payload, updated_at: new Date().toISOString() };
                          return { data: db.profiles[idx], error: null };
                        }
                      }
                      return { data: null, error: new Error('Record not found') };
                    },
                  }),
                };
              },
            };
          },
        };
      },
      rpc: async (fnName, params) => {
        if (fnName === 'create_workspace_with_owner') {
          if (!currentUser) {
            return { data: null, error: { code: '42501', message: 'Unauthorized' } };
          }
          const { p_name, p_slug } = params;
          // Check duplicate slug
          const exists = db.workspaces.some((w) => w.slug === p_slug);
          if (exists) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
          }

          const newWs = {
            id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: p_name,
            slug: p_slug,
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.workspaces.push(newWs);
          db.workspace_members.push({
            workspace_id: newWs.id,
            user_id: currentUser.id,
            role: 'owner',
            joined_at: new Date().toISOString(),
          });

          return {
            data: {
              ...newWs,
              role: 'owner',
            },
            error: null,
          };
        }
        return { data: null, error: new Error('RPC not found') };
      },
    };
  };

  const defaultMock = {
    auth: {
      getUser: async (tok) => {
        if (tok === VALID_TOKENS.alice) {
          return { data: { user: TEST_USERS.alice }, error: null };
        }
        if (tok === VALID_TOKENS.bob) {
          return { data: { user: TEST_USERS.bob }, error: null };
        }
        return { data: { user: null }, error: new Error('Invalid or expired token') };
      },
    },
  };

  return {
    db,
    defaultMock,
    getClientForToken,
  };
};

export const setupTestApp = () => {
  const env = createMockSupabaseEnvironment();
  setSupabaseClientForTesting(env.defaultMock);
  setScopedClientFactoryForTesting((tok) => env.getClientForToken(tok));
  const app = createApp();
  return { app, env };
};
