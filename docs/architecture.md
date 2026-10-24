# TeamFlow — Architecture & Security Specification (Phase 1)

## 1. System Overview
TeamFlow is a full-stack real-time project management platform. Phase 1 establishes the **Foundation & Authentication** architecture:
- Identity management via **Supabase Auth**
- User profile provisioning via PostgreSQL triggers
- Atomic workspace creation and membership isolation
- Server-side access token verification and authorization
- PostgreSQL **Row Level Security (RLS)** with non-recursive security definer functions

```
┌────────────────────────────────┐
│      React + Vite Frontend     │
│   (TanStack Query, Tailwind)   │
└───────────────┬────────────────┘
                │
                │ 1. Bearer Access Token (JWT)
                ▼
┌────────────────────────────────┐
│      Express Backend API       │
│  - Centralized Auth Middleware │
│  - Zod Request Validation      │
│  - User-Scoped Supabase Client │
└───────────────┬────────────────┘
                │
                │ 2. Scoped Queries & RPC
                ▼
┌────────────────────────────────────────────────────────┐
│               Supabase PostgreSQL                      │
│  - profiles (Referencing auth.users)                   │
│  - workspaces                                          │
│  - workspace_members (owner, admin, member, viewer)    │
│  - PostgreSQL RLS Policies                             │
│  - Atomic RPC Function: create_workspace_with_owner()  │
└────────────────────────────────────────────────────────┘
```

## 2. Row Level Security (RLS) & Non-Recursive Isolation
Supabase policies often fall victim to infinite recursion when a policy on `workspaces` queries `workspace_members`, which in turn has a policy querying `workspaces`.

To prevent this:
1. `public.is_workspace_member(workspace_id, user_id)` is declared as `SECURITY DEFINER` and `STABLE`. It executes with elevated database privileges to check the membership table directly without triggering secondary policy checks.
2. `public.get_workspace_role(workspace_id, user_id)` safely returns the member's role for authorization policies.

## 3. Atomic Workspace Creation
Client input alone cannot assign roles or create memberships. Workspace creation executes through `public.create_workspace_with_owner(p_name, p_slug)`:
1. Verifies that `auth.uid()` is present (rejects unauthenticated calls).
2. Validates workspace name length and slug regex format.
3. Atomically inserts the record into `public.workspaces`.
4. Atomically inserts the owner into `public.workspace_members` with role `'owner'`.
5. Returns the consolidated workspace JSON representation.
6. Execution is granted strictly to the `authenticated` role.

## 4. Token Verification & Safe Backend Middleware
The Express backend never trusts decoded headers or claims from the client without cryptographic validation.
- `requireAuth` calls `supabase.auth.getUser(token)`.
- If valid, creates a scoped Supabase client configured with the Bearer token.
- All database queries made through `req.scopedSupabase` operate under the authenticated user's Postgres role and identity, ensuring Row Level Security is enforced at the database level.
