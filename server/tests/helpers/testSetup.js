import { createApp } from '../../src/app.js';
import { setSupabaseClientForTesting, setScopedClientFactoryForTesting } from '../../src/config/supabase.js';

export const TEST_USERS = {
  alice: {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'alice@example.com',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: 'Alice Cooper', avatar_url: 'https://example.com/alice.png' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  bob: {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'bob@example.com',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: 'Bob Marley', avatar_url: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  carol: {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'carol@example.com',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: 'Carol Danvers', avatar_url: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  danViewer: {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'dan@example.com',
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: 'Dan Viewer', avatar_url: null },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export const VALID_TOKENS = {
  alice: 'valid-alice-token',
  bob: 'valid-bob-token',
  carol: 'valid-carol-token',
  danViewer: 'valid-dan-token',
};

export const WORKSPACE_IDS = {
  alice: 'aaaaaa00-0000-4000-a000-aaaaaaaaaaaa',
  bob: 'bbbbbb00-0000-4000-b000-bbbbbbbbbbbb',
};

export const PROJECT_IDS = {
  aliceProject: '11111111-2222-4000-a000-000000000001',
  bobProject: '22222222-2222-4000-b000-000000000001',
};

export const TASK_IDS = {
  aliceTask: '33333333-2222-4000-a000-000000000001',
};

/**
 * Creates an in-memory isolated database state simulating Supabase PostgreSQL with RLS.
 */
export const createMockSupabaseEnvironment = () => {
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
      {
        id: TEST_USERS.carol.id,
        full_name: 'Carol Danvers',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: TEST_USERS.danViewer.id,
        full_name: 'Dan Viewer',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    workspaces: [
      {
        id: WORKSPACE_IDS.alice,
        name: "Alice's Workspace",
        slug: 'alice-workspace',
        description: 'Alice test workspace',
        created_by: TEST_USERS.alice.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    workspace_members: [
      {
        id: '11111111-0000-4000-a000-000000000001',
        workspace_id: WORKSPACE_IDS.alice,
        user_id: TEST_USERS.alice.id,
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
      {
        id: '11111111-0000-4000-a000-000000000002',
        workspace_id: WORKSPACE_IDS.alice,
        user_id: TEST_USERS.carol.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      },
    ],
    projects: [
      {
        id: PROJECT_IDS.aliceProject,
        workspace_id: WORKSPACE_IDS.alice,
        name: 'Alpha Project',
        description: 'First project for Alice',
        status: 'active',
        start_date: '2026-01-01',
        due_date: '2026-12-31',
        created_by: TEST_USERS.alice.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
      },
    ],
    tasks: [
      {
        id: TASK_IDS.aliceTask,
        project_id: PROJECT_IDS.aliceProject,
        title: 'Setup Infrastructure',
        description: 'Initial dev setup',
        status: 'todo',
        priority: 'high',
        assignee_id: TEST_USERS.carol.id,
        created_by: TEST_USERS.alice.id,
        due_date: '2026-06-30',
        position: 1000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };

  db.WORKSPACE_IDS = WORKSPACE_IDS;
  db.PROJECT_IDS = PROJECT_IDS;
  db.TASK_IDS = TASK_IDS;

  const getUserForToken = (token) => {
    if (token === VALID_TOKENS.alice) return TEST_USERS.alice;
    if (token === VALID_TOKENS.bob) return TEST_USERS.bob;
    if (token === VALID_TOKENS.carol) return TEST_USERS.carol;
    if (token === VALID_TOKENS.danViewer) return TEST_USERS.danViewer;
    return null;
  };

  const getMembership = (workspaceId, userId) =>
    db.workspace_members.find(
      (m) => m.workspace_id === workspaceId && m.user_id === userId
    ) || null;

  const getClientForToken = (token) => {
    const currentUser = getUserForToken(token);

    const canAccessWorkspace = (wsId) =>
      Boolean(currentUser && getMembership(wsId, currentUser.id));

    const canAccessProject = (projId) => {
      const proj = db.projects.find((p) => p.id === projId);
      if (!proj) return false;
      return canAccessWorkspace(proj.workspace_id);
    };

    const canAccessTask = (taskId) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return false;
      return canAccessProject(task.project_id);
    };

    const attachRelationsToTask = (t) => {
      const assignee = t.assignee_id ? db.profiles.find((p) => p.id === t.assignee_id) : null;
      const creator = t.created_by ? db.profiles.find((p) => p.id === t.created_by) : null;
      const project = db.projects.find((p) => p.id === t.project_id);
      return {
        ...t,
        assignee: assignee ? { id: assignee.id, full_name: assignee.full_name, avatar_url: assignee.avatar_url } : null,
        creator: creator ? { id: creator.id, full_name: creator.full_name, avatar_url: creator.avatar_url } : null,
        project: project ? { id: project.id, name: project.name, workspace_id: project.workspace_id } : null,
      };
    };

    return {
      auth: {
        getUser: async (tok) => {
          const u = getUserForToken(tok);
          return u
            ? { data: { user: u }, error: null }
            : { data: { user: null }, error: new Error('Invalid or expired token') };
        },
      },
      from: (table) => {
        let _fields = '*';
        let _filters = {};

        const executeSelect = () => {
          if (!currentUser) return [];

          if (table === 'profiles') {
            return db.profiles
              .filter((p) => {
                // RLS: user can only see their own profile
                if (p.id !== currentUser.id) return false;
                for (const [k, v] of Object.entries(_filters)) {
                  if (p[k] !== v) return false;
                }
                return true;
              });
          }

          if (table === 'projects') {
            return db.projects
              .filter((p) => canAccessWorkspace(p.workspace_id))
              .filter((p) => {
                for (const [k, v] of Object.entries(_filters)) {
                  if (p[k] !== v) return false;
                }
                return true;
              });
          }

          if (table === 'tasks') {
            return db.tasks
              .filter((t) => canAccessTask(t.id))
              .filter((t) => {
                for (const [k, v] of Object.entries(_filters)) {
                  if (t[k] !== v) return false;
                }
                return true;
              })
              .map(attachRelationsToTask);
          }

          if (table === 'workspaces') {
            return db.workspaces
              .filter((w) => canAccessWorkspace(w.id))
              .filter((w) => {
                for (const [k, v] of Object.entries(_filters)) {
                  if (w[k] !== v) return false;
                }
                return true;
              });
          }

          if (table === 'workspace_members') {
            // Check workspace access
            const wsId = _filters['workspace_id'];
            if (wsId && !canAccessWorkspace(wsId)) {
              return [];
            }

            const members = db.workspace_members.filter((m) => {
              for (const [k, v] of Object.entries(_filters)) {
                if (m[k] !== v) return false;
              }
              return true;
            });

            if (_fields && _fields.includes('workspace:')) {
              return members.map((m) => ({
                role: m.role,
                joined_at: m.joined_at,
                workspace: db.workspaces.find((w) => w.id === m.workspace_id) || null,
              }));
            }

            if (_fields && _fields.includes('profile:')) {
              return members.map((m) => {
                const profile = db.profiles.find((p) => p.id === m.user_id);
                return {
                  id: m.id,
                  role: m.role,
                  joined_at: m.joined_at,
                  user_id: m.user_id,
                  profile: profile || null,
                };
              });
            }

            return members;
          }

          return db[table] || [];
        };

        const createQueryObject = () => {
          const queryObj = {
            then: (resolve, reject) => {
              try {
                const results = executeSelect();
                resolve({ data: results, error: null });
              } catch (err) {
                reject(err);
              }
            },
            eq: (col, val) => {
              _filters[col] = val;
              return createQueryObject();
            },
            order: (col, opts = {}) => {
              const obj = createQueryObject();
              const origThen = obj.then;
              obj.then = (resolve, reject) => {
                origThen(({ data, error }) => {
                  if (error || !Array.isArray(data)) return resolve({ data, error });
                  const sorted = [...data].sort((a, b) => {
                    const valA = a[col] ?? '';
                    const valB = b[col] ?? '';
                    if (opts.ascending === false) return valA < valB ? 1 : -1;
                    return valA > valB ? 1 : -1;
                  });
                  resolve({ data: sorted, error: null });
                }, reject);
              };
              return obj;
            },
            limit: (num) => {
              const obj = createQueryObject();
              const origThen = obj.then;
              obj.then = (resolve, reject) => {
                origThen(({ data, error }) => {
                  if (error || !Array.isArray(data)) return resolve({ data, error });
                  resolve({ data: data.slice(0, num), error: null });
                }, reject);
              };
              return obj;
            },
            maybeSingle: async () => {
              const results = executeSelect();
              return { data: results.length > 0 ? results[0] : null, error: null };
            },
            single: async () => {
              const results = executeSelect();
              if (results.length === 0) return { data: null, error: new Error('Not found') };
              return { data: results[0], error: null };
            },
          };
          return queryObj;
        };

        return {
          select: (fields) => {
            _fields = fields || '*';
            return createQueryObject();
          },

          insert: (payload) => {
            const row = Array.isArray(payload) ? payload[0] : payload;
            const newId = row.id || `${table.slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            const createdRow = {
              ...row,
              id: newId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            if (table === 'projects') db.projects.push(createdRow);
            if (table === 'tasks') db.tasks.push(createdRow);
            if (table === 'workspaces') db.workspaces.push(createdRow);
            if (table === 'workspace_members') db.workspace_members.push(createdRow);

            return {
              select: () => ({
                single: async () => {
                  if (table === 'tasks') {
                    return { data: attachRelationsToTask(createdRow), error: null };
                  }
                  return { data: createdRow, error: null };
                },
              }),
            };
          },

          update: (payload) => {
            return {
              eq: (col, val) => {
                return {
                  select: () => ({
                    single: async () => {
                      if (table === 'workspaces') {
                        // Slug uniqueness check
                        if (payload.slug) {
                          const slugExists = db.workspaces.some(
                            (w) => w.slug === payload.slug && w.id !== val
                          );
                          if (slugExists) {
                            return { data: null, error: { code: '23505', message: 'duplicate key' } };
                          }
                        }
                      }
                      const idx = db[table]?.findIndex((item) => item[col] === val);
                      if (idx === -1) {
                        return { data: null, error: new Error('Not found') };
                      }
                      db[table][idx] = {
                        ...db[table][idx],
                        ...payload,
                        updated_at: new Date().toISOString(),
                      };
                      const updated = db[table][idx];
                      if (table === 'tasks') {
                        return { data: attachRelationsToTask(updated), error: null };
                      }
                      return { data: updated, error: null };
                    },
                  }),
                };
              },
            };
          },

          delete: () => {
            return {
              eq: (col, val) => {
                db[table] = db[table]?.filter((item) => item[col] !== val) || [];
                return Promise.resolve({ data: null, error: null });
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
          const { p_name, p_slug, p_description } = params;
          const exists = db.workspaces.some((w) => w.slug === p_slug);
          if (exists) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
          }
          const newWs = {
            id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: p_name,
            slug: p_slug,
            description: p_description ?? null,
            created_by: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.workspaces.push(newWs);
          db.workspace_members.push({
            id: `mem-${Date.now()}`,
            workspace_id: newWs.id,
            user_id: currentUser.id,
            role: 'owner',
            joined_at: new Date().toISOString(),
          });
          return { data: { ...newWs, role: 'owner' }, error: null };
        }
        return { data: null, error: new Error('RPC not found') };
      },
    };
  };

  const defaultMock = {
    auth: {
      getUser: async (tok) => {
        const u = getUserForToken(tok);
        return u
          ? { data: { user: u }, error: null }
          : { data: { user: null }, error: new Error('Invalid or expired token') };
      },
    },
  };

  return { db, defaultMock, getClientForToken, WORKSPACE_IDS, PROJECT_IDS, TASK_IDS };
};

export const setupTestApp = () => {
  const env = createMockSupabaseEnvironment();
  setSupabaseClientForTesting(env.defaultMock);
  setScopedClientFactoryForTesting((tok) => env.getClientForToken(tok));
  const app = createApp();
  return { app, env };
};
