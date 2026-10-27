# TeamFlow — Phase 1: Foundation & Authentication

TeamFlow is an advanced Real-Time Project Management System built with React, Node.js, Express, Supabase PostgreSQL, Supabase Auth, and Socket.IO.

This repository contains **Phase 1: Foundation & Authentication**, establishing the core architectural foundation:
- Secure full-stack identity management and session restoration via **Supabase Auth**.
- Automated user profile provisioning via PostgreSQL triggers.
- Multi-tenant workspace isolation with PostgreSQL **Row Level Security (RLS)**.
- Atomic workspace creation and initial owner membership provisioning using a secure database function.
- Centralized server authentication middleware, Zod request validation, and uniform API responses.
- Modern, accessible React SaaS interface built with Vite, Tailwind CSS, TanStack Query, and Lucide Icons.

---

## 1. Technology Stack

### Frontend
- **Framework**: React.js with Vite (ES Modules, JavaScript & JSX only)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **Server State**: TanStack Query (React Query v5)
- **Auth & Database SDK**: Supabase JavaScript Client (`@supabase/supabase-js`)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (v20+ recommended)
- **Framework**: Express.js (ES Modules)
- **Validation**: Zod
- **SDK**: Supabase JavaScript Client (`@supabase/supabase-js`)
- **Development**: Nodemon
- **Testing**: Vitest & Supertest

### Database & Security
- **Engine**: Supabase PostgreSQL
- **Identity**: Supabase Auth (Email & Password, Password Recovery)
- **Authorization**: PostgreSQL Row Level Security (RLS) with non-recursive security definer functions
- **Migrations**: Version-controlled SQL migration scripts

---

## 2. Architecture Overview

```
TeamFlow/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── app/                # Route definitions, Protected & Public route guards
│   │   ├── components/         # Reusable UI primitives (Button, Input, Alert, Badge, Spinner)
│   │   ├── features/
│   │   │   ├── auth/           # AuthContext, login/register/reset forms, useAuth hook
│   │   │   └── workspaces/     # Workspace cards, lists, creation form, useWorkspaces hook
│   │   ├── layouts/            # AppLayout (nav, header) and AuthLayout (split card)
│   │   ├── lib/                # Supabase client, centralized API client, utilities
│   │   ├── pages/              # Route pages (Login, Register, Dashboard, NewWorkspace, Profile)
│   │   └── test/               # Frontend Vitest integration tests
│   ├── .env.example            # Client environment placeholder template
│   └── package.json
├── server/                     # Backend Node/Express API
│   ├── src/
│   │   ├── config/             # Environment configuration & Supabase client factories
│   │   ├── middleware/         # Centralized auth middleware, Zod validator, error handler
│   │   ├── modules/
│   │   │   ├── auth/           # Safe profile retrieval and update endpoints
│   │   │   └── workspaces/     # Atomic workspace creation and membership listing
│   │   ├── utils/              # Uniform JSON response envelopes, logger, AppError
│   │   ├── app.js              # Express app definition & route mounting
│   │   └── server.js           # Server bootstrap
│   ├── tests/                  # Backend Vitest & Supertest test suite
│   ├── .env.example            # Server environment placeholder template
│   └── package.json
├── supabase/
│   ├── migrations/             # Version-controlled SQL schema & RLS migrations
│   └── seed.sql                # Seed and verification queries
├── docs/                       # Architecture diagrams & API specification
├── package.json                # Monorepo root workspace scripts
├── .gitignore
└── README.md
```

---

## 3. Database Schema & Row Level Security (RLS)

### Tables
1. **`profiles`**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `full_name TEXT`
   - `avatar_url TEXT`
   - `created_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL`
   - `updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()) NOT NULL`
2. **`workspaces`**:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `name TEXT NOT NULL`
   - `slug TEXT NOT NULL UNIQUE` (Validated regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$`)
   - `created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
   - `created_at TIMESTAMPTZ` / `updated_at TIMESTAMPTZ`
3. **`workspace_members`**:
   - `workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE`
   - `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`
   - `role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer'))`
   - `joined_at TIMESTAMPTZ`
   - Composite Primary Key: `(workspace_id, user_id)`

### Automated Triggers & Functions
- **`handle_new_user()`**: An `AFTER INSERT` trigger on `auth.users` that automatically provisions a `profiles` row using the user's registration metadata (`full_name`).
- **`create_workspace_with_owner(p_name, p_slug)`**: An atomic `SECURITY DEFINER` function that creates the workspace and assigns the calling user (`auth.uid()`) as the initial `'owner'` within an ACID transaction.
- **Non-Recursive RLS Helpers**: `is_workspace_member()` and `get_workspace_role()` execute with `SECURITY DEFINER` privileges, bypassing self-referential policy evaluations and avoiding infinite recursion loops.

---

## 4. Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Supabase Account**: A free Supabase project (or local Supabase CLI instance)

---

## 5. Installation & Setup Instructions

### Step 1: Clone and Install Dependencies
Install all monorepo dependencies across root, server, and client:
```bash
git clone <repository-url>
cd TeamFlow

# Install backend dependencies
cd server
npm install
cd ..

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Supabase Project Setup & Database Migration
1. Go to your [Supabase Dashboard](https://database.new) and create a project.
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Copy the contents of [`supabase/migrations/20261024000001_phase1_foundation_auth.sql`](supabase/migrations/20261024000001_phase1_foundation_auth.sql).
4. Run the SQL script to create all tables, indexes, triggers, functions, and RLS policies.
5. In your Supabase Project Settings under **API**, locate your:
   - **Project URL**
   - **anon / public key**

### Step 3: Configure Environment Variables

#### Backend (`server/.env`):
Create `server/.env` based on `server/.env.example`:
```bash
PORT=8000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

#### Frontend (`client/.env`):
Create `client/.env` based on `client/.env.example`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 6. Running the Application

### Development Mode

To start the backend API server:
```bash
npm run dev:server
# Server runs on http://localhost:8000
```

To start the frontend Vite development server:
```bash
npm run dev:client
# Frontend runs on http://localhost:5173
```

You can also run both commands in separate terminals.

---

## 7. Available API Endpoints

All backend endpoints are prefixed with `/api/v1`:

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | No | Basic API health status |
| `GET` | `/api/v1/auth/me` | Yes (Bearer) | Returns safe profile information for the authenticated user |
| `PATCH` | `/api/v1/auth/profile` | Yes (Bearer) | Updates permitted profile fields (`full_name`, `avatar_url`) |
| `GET` | `/api/v1/workspaces` | Yes (Bearer) | Returns only workspaces the authenticated user belongs to |
| `POST` | `/api/v1/workspaces` | Yes (Bearer) | Atomically creates a workspace and assigns user as owner |

### Consistent JSON Response Envelopes
- **Success (`200`, `201`)**:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "Optional message"
  }
  ```
- **Error (`400`, `401`, `403`, `404`, `409`, `500`)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Human readable error description",
      "details": [ ... ]
    }
  }
  ```

---

## 8. Testing Commands & Execution

TeamFlow includes automated test suites covering backend endpoints, authentication middleware, Zod validation, RLS data isolation, and frontend loading/error states.

### Run All Tests (Full Monorepo)
```bash
npm test
```

### Run Server Tests Only
```bash
npm run test:server
# Or from server directory:
cd server && npm test
```
**Test coverage includes**:
- `health.test.js`: Health endpoint and 404 route handling.
- `auth.test.js`: Missing token (401), invalid/expired token (401), valid profile retrieval (200), profile update, strict payload validation (400).
- `workspaces.test.js`: Unauthenticated rejection (401), invalid name/slug format (400), unauthorized role escalation rejection (400), atomic creation with owner membership (201), duplicate slug conflict handling (409).
- `rls-isolation.test.js`: Cross-user workspace membership isolation, profile privacy isolation.

### Run Frontend Tests Only
```bash
npm run test:client
# Or from client directory:
cd client && npm test
```
**Test coverage includes**:
- Form validation on empty login submission.
- Error alert state handling on Supabase authentication failure.
- Password mismatch detection on registration form.

---

## 9. Security Considerations

1. **Zero Secret Key Exposure**:
   - `SUPABASE_SERVICE_ROLE_KEY` is **never** committed or exposed to the frontend.
   - Frontend only accesses the public publishable anon key (`VITE_SUPABASE_PUBLISHABLE_KEY`).
2. **Cryptographic Token Verification**:
   - The Express backend **never** relies on unverified or decoded JWTs. All incoming Bearer tokens are cryptographically verified using `supabase.auth.getUser(token)`.
3. **User-Scoped Database Queries**:
   - Authorized backend endpoints construct a user-scoped Supabase client that forwards the verified Bearer token to Postgres, ensuring Postgres evaluates `auth.uid()` and enforces Row Level Security.
4. **Strict Role Escalation Prevention**:
   - Client requests cannot pass `role`, `created_by`, or `user_id` when creating a workspace. Zod validation operates in `.strict()` mode and rejects unrecognized parameters.
5. **No Infinite RLS Policy Recursion**:
   - Helper functions are marked `SECURITY DEFINER` and query underlying membership records directly, avoiding recursive loops in Supabase.
6. **CORS & Rate Safeguards**:
   - CORS is restricted to authorized origins (`CLIENT_URL`).
   - Request bodies are capped at `100kb` to prevent payload abuse.
7. **Sanitized Server Logs**:
   - Sensitive headers, passwords, and tokens are automatically redacted by the logger utility before printing to server logs.

---

## 10. Common Troubleshooting Steps

| Issue | Cause | Resolution |
|---|---|---|
| `Token verification failed (401)` | Expired or invalid Supabase access token | Sign in again or verify that frontend and backend share the exact same `SUPABASE_URL`. |
| `Duplicate slug error (409)` | Another workspace is using the requested URL slug | Provide a unique workspace slug. The slug generator creates clean URL-friendly slugs automatically. |
| `Vite PostCSS Tailwind warning` | Tailwind v4 plugin resolution | `@tailwindcss/postcss` is installed and configured in `postcss.config.js`. |
| `Missing Supabase environment variables` | `.env` file not created | Ensure `.env` is created in both `server/` and `client/` directories based on `.env.example`. |
| `Infinite recursion in RLS query` | Workspace policy queries `workspace_members` which re-checks `workspaces` | Run migration `20261024000001_phase1_foundation_auth.sql` which uses `SECURITY DEFINER` functions to break recursion. |
