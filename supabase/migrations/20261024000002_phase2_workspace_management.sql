-- Migration: Phase 2 Workspace Management
-- Extends Phase 1 schema: adds description to workspaces,
-- promotes workspace_members to a proper table with a UUID PK,
-- updates the atomic RPC function, and adds Phase 2 helper functions.

-- ============================================================
-- 1. Add `description` column to workspaces (nullable, no breaking change)
-- ============================================================
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================
-- 2. Add a surrogate UUID `id` to workspace_members
--    Phase 1 used composite PK (workspace_id, user_id).
--    We add an id column and keep the composite UNIQUE constraint.
-- ============================================================
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Make id the primary key (drop old composite PK first if it exists).
-- We do this safely by checking and recreating constraints.
DO $$
BEGIN
  -- Drop composite PK if it is named workspace_members_pkey
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_members_pkey'
      AND conrelid = 'public.workspace_members'::regclass
  ) THEN
    ALTER TABLE public.workspace_members DROP CONSTRAINT workspace_members_pkey;
  END IF;

  -- Ensure id is NOT NULL and unique before making it PK
  UPDATE public.workspace_members SET id = gen_random_uuid() WHERE id IS NULL;
  ALTER TABLE public.workspace_members ALTER COLUMN id SET NOT NULL;

  -- Add composite UNIQUE constraint on (workspace_id, user_id) if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_members_workspace_id_user_id_key'
      AND conrelid = 'public.workspace_members'::regclass
  ) THEN
    ALTER TABLE public.workspace_members
      ADD CONSTRAINT workspace_members_workspace_id_user_id_key
      UNIQUE (workspace_id, user_id);
  END IF;

  -- Add new UUID primary key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_members_id_pkey'
      AND conrelid = 'public.workspace_members'::regclass
  ) THEN
    ALTER TABLE public.workspace_members
      ADD CONSTRAINT workspace_members_id_pkey PRIMARY KEY (id);
  END IF;
END;
$$;

-- ============================================================
-- 3. Additional indexes for Phase 2 queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_workspaces_description ON public.workspaces USING gin(to_tsvector('english', COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(workspace_id, role);

-- ============================================================
-- 4. Helper: check if user is owner OR admin in a workspace
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$;

-- ============================================================
-- 5. Update atomic workspace creation function to accept description
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_name TEXT,
  p_slug TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_workspace public.workspaces%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated' USING ERRCODE = '42501';
  END IF;

  IF length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Workspace name must be at least 2 characters long' USING ERRCODE = '22023';
  END IF;

  IF length(trim(p_slug)) < 2 OR trim(p_slug) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug must consist of lowercase alphanumeric characters and single hyphens' USING ERRCODE = '22023';
  END IF;

  -- Atomic insert workspace
  INSERT INTO public.workspaces (name, slug, description, created_by)
  VALUES (trim(p_name), trim(p_slug), p_description, v_user_id)
  RETURNING * INTO v_workspace;

  -- Atomic insert owner membership
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace.id, v_user_id, 'owner');

  RETURN json_build_object(
    'id', v_workspace.id,
    'name', v_workspace.name,
    'slug', v_workspace.slug,
    'description', v_workspace.description,
    'created_by', v_workspace.created_by,
    'created_at', v_workspace.created_at,
    'updated_at', v_workspace.updated_at,
    'role', 'owner'
  );
END;
$$;

-- Ensure correct permissions on updated function
REVOKE ALL ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT) TO authenticated;

-- Grant permissions on new helper
REVOKE ALL ON FUNCTION public.is_workspace_admin(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID, UUID) TO authenticated;

-- ============================================================
-- 6. Fine-grained RLS policies for workspace updates by field
--    (Phase 1 allowed any admin to update; Phase 2 adds finer policy)
-- ============================================================

-- Allow owner to transfer settings (update slug, name, description)
-- Admins can update name and description but NOT slug
-- We implement this at the application layer (service validates field access by role)
-- and keep the RLS policy at the admin+ level for simplicity.

-- The existing policies from Phase 1 remain valid; no removals needed.

-- ============================================================
-- 7. Additional workspace_members policies for Phase 2
--    Allow authenticated users to insert the FIRST membership (owner) via RPC only.
--    The SECURITY DEFINER RPC bypasses RLS for the INSERT, so we can keep
--    the existing restrictive policies.
-- ============================================================

-- Policy: deny direct self-membership modification (prevent self-promotion)
DROP POLICY IF EXISTS "Users cannot modify their own membership role" ON public.workspace_members;
CREATE POLICY "Users cannot modify their own membership role"
  ON public.workspace_members
  FOR UPDATE
  TO authenticated
  USING (
    -- Only owner/admin can update memberships, and they cannot change the owner's role
    public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
    AND (
      -- Owners can update any membership
      public.get_workspace_role(workspace_id, auth.uid()) = 'owner'
      OR
      -- Admins cannot touch the owner membership
      (public.get_workspace_role(workspace_id, auth.uid()) = 'admin'
       AND role != 'owner')
    )
  )
  WITH CHECK (
    public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
    AND (
      public.get_workspace_role(workspace_id, auth.uid()) = 'owner'
      OR
      (public.get_workspace_role(workspace_id, auth.uid()) = 'admin'
       AND role != 'owner')
    )
  );
