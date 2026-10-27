-- ============================================================
-- TeamFlow: Complete Database Schema (Phases 1 - 4)
-- Run this script in the Supabase Dashboard SQL Editor
-- (Project: qlxuhtcnmglzhxncxftc)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Utility: Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. Profiles Table & Trigger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Auto-provision user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill profile for any existing auth.users without a row
INSERT INTO public.profiles (id, full_name, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Workspaces & Workspace Members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT workspaces_name_length CHECK (char_length(trim(name)) >= 2),
  CONSTRAINT workspaces_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

DROP TRIGGER IF EXISTS set_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER set_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT workspace_members_workspace_user_key UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON public.workspace_members(workspace_id, role);

-- Workspace Membership Helper Functions
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = p_workspace_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_role(p_workspace_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
$$;

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

-- Atomic Workspace Creation Function
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

  INSERT INTO public.workspaces (name, slug, description, created_by)
  VALUES (trim(p_name), trim(p_slug), p_description, v_user_id)
  RETURNING * INTO v_workspace;

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

REVOKE ALL ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_workspace_with_owner(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(UUID, UUID) TO authenticated;

-- ============================================================
-- 3. Projects & Tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  archived_at TIMESTAMPTZ NULL,

  CONSTRAINT projects_name_length CHECK (char_length(trim(name)) >= 1),
  CONSTRAINT projects_status_check CHECK (status IN ('active', 'completed', 'on_hold', 'archived')),
  CONSTRAINT projects_date_check CHECK (start_date IS NULL OR due_date IS NULL OR start_date <= due_date)
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  due_date DATE NULL,
  position NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT tasks_title_not_empty CHECK (char_length(trim(title)) >= 1),
  CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(project_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(project_id, status, position);

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Project & Task Helpers
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = p_project_id AND wm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_project_role(p_project_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.role FROM public.projects p
  JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
  WHERE p.id = p_project_id AND wm.user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_project_role(UUID, UUID) TO authenticated;

-- Assignee Validation Trigger
CREATE OR REPLACE FUNCTION public.validate_task_assignee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  IF NEW.assignee_id IS NOT NULL THEN
    SELECT workspace_id INTO v_workspace_id FROM public.projects WHERE id = NEW.project_id;
    IF v_workspace_id IS NULL THEN
      RAISE EXCEPTION 'Project not found' USING ERRCODE = '23503';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = v_workspace_id AND user_id = NEW.assignee_id
    ) THEN
      RAISE EXCEPTION 'Task assignee must be a member of the workspace' USING ERRCODE = '23503';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_task_assignee ON public.tasks;
CREATE TRIGGER trg_validate_task_assignee
  BEFORE INSERT OR UPDATE OF assignee_id, project_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_task_assignee();

-- ============================================================
-- 4. Comments, Notifications & Activity Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  edited_at TIMESTAMPTZ NULL,

  CONSTRAINT task_comments_content_length CHECK (char_length(trim(content)) >= 1 AND char_length(content) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(task_id, created_at ASC);

DROP TRIGGER IF EXISTS set_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER set_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.is_task_member(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.projects p ON p.id = t.project_id
    JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE t.id = p_task_id AND wm.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_task_role(p_task_id UUID, p_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wm.role FROM public.tasks t
  JOIN public.projects p ON p.id = t.project_id
  JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
  WHERE t.id = p_task_id AND wm.user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.is_task_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_role(UUID, UUID) TO authenticated;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT NULL,
  entity_id UUID NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  read_at TIMESTAMPTZ NULL,

  CONSTRAINT notifications_title_not_empty CHECK (char_length(trim(title)) >= 1),
  CONSTRAINT notifications_type_check CHECK (
    type IN ('task_assigned', 'task_comment', 'task_status_changed', 'task_due_soon', 'task_overdue')
  )
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT activity_logs_action_not_empty CHECK (char_length(trim(action)) >= 1)
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON public.activity_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- ============================================================
-- 5. Row Level Security (RLS) Configuration
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Workspaces Policies
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
CREATE POLICY "Members can view workspaces"
  ON public.workspaces FOR SELECT TO authenticated
  USING (public.is_workspace_member(id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert workspace" ON public.workspaces;
CREATE POLICY "Authenticated users can insert workspace"
  ON public.workspaces FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners and admins can update workspace" ON public.workspaces;
CREATE POLICY "Owners and admins can update workspace"
  ON public.workspaces FOR UPDATE TO authenticated
  USING (public.get_workspace_role(id, auth.uid()) IN ('owner', 'admin'))
  WITH CHECK (public.get_workspace_role(id, auth.uid()) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "Owners can delete workspace" ON public.workspaces;
CREATE POLICY "Owners can delete workspace"
  ON public.workspaces FOR DELETE TO authenticated
  USING (public.get_workspace_role(id, auth.uid()) = 'owner');

-- Workspace Members Policies
DROP POLICY IF EXISTS "Members can view memberships of their workspaces" ON public.workspace_members;
CREATE POLICY "Members can view memberships of their workspaces"
  ON public.workspace_members FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Owners and admins can manage memberships" ON public.workspace_members;
CREATE POLICY "Owners and admins can manage memberships"
  ON public.workspace_members FOR ALL TO authenticated
  USING (public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'))
  WITH CHECK (public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'));

-- Projects Policies
DROP POLICY IF EXISTS "Workspace members can view projects" ON public.projects;
CREATE POLICY "Workspace members can view projects"
  ON public.projects FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

DROP POLICY IF EXISTS "Workspace owners and admins can create projects" ON public.projects;
CREATE POLICY "Workspace owners and admins can create projects"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin')
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Workspace owners and admins can update projects" ON public.projects;
CREATE POLICY "Workspace owners and admins can update projects"
  ON public.projects FOR UPDATE TO authenticated
  USING (public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'))
  WITH CHECK (public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "Workspace owners and admins can delete projects" ON public.projects;
CREATE POLICY "Workspace owners and admins can delete projects"
  ON public.projects FOR DELETE TO authenticated
  USING (public.get_workspace_role(workspace_id, auth.uid()) IN ('owner', 'admin'));

-- Tasks Policies
DROP POLICY IF EXISTS "Workspace members can view tasks" ON public.tasks;
CREATE POLICY "Workspace members can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id, auth.uid()));

DROP POLICY IF EXISTS "Workspace members can create tasks" ON public.tasks;
CREATE POLICY "Workspace members can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.get_project_role(project_id, auth.uid()) IN ('owner', 'admin', 'member')
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Workspace members can update tasks" ON public.tasks;
CREATE POLICY "Workspace members can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.get_project_role(project_id, auth.uid()) IN ('owner', 'admin', 'member'))
  WITH CHECK (public.get_project_role(project_id, auth.uid()) IN ('owner', 'admin', 'member'));

DROP POLICY IF EXISTS "Workspace members can delete tasks" ON public.tasks;
CREATE POLICY "Workspace members can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    public.get_project_role(project_id, auth.uid()) IN ('owner', 'admin')
    OR (public.get_project_role(project_id, auth.uid()) = 'member' AND created_by = auth.uid())
  );

-- Task Comments Policies
DROP POLICY IF EXISTS "Workspace members can view task comments" ON public.task_comments;
CREATE POLICY "Workspace members can view task comments"
  ON public.task_comments FOR SELECT TO authenticated
  USING (public.is_task_member(task_id, auth.uid()));

DROP POLICY IF EXISTS "Workspace members can create task comments" ON public.task_comments;
CREATE POLICY "Workspace members can create task comments"
  ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (
    public.is_task_member(task_id, auth.uid())
    AND public.get_task_role(task_id, auth.uid()) IN ('owner', 'admin', 'member')
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors can update their own task comments" ON public.task_comments;
CREATE POLICY "Authors can update their own task comments"
  ON public.task_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND public.is_task_member(task_id, auth.uid()))
  WITH CHECK (author_id = auth.uid() AND public.is_task_member(task_id, auth.uid()));

DROP POLICY IF EXISTS "Authors and admins can delete task comments" ON public.task_comments;
CREATE POLICY "Authors and admins can delete task comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (
    public.is_task_member(task_id, auth.uid())
    AND (author_id = auth.uid() OR public.get_task_role(task_id, auth.uid()) IN ('owner', 'admin'))
  );

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (recipient_id = auth.uid());

-- Activity Logs Policies
DROP POLICY IF EXISTS "Workspace members can view activity logs" ON public.activity_logs;
CREATE POLICY "Workspace members can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

-- ============================================================
-- 6. Supabase Realtime Publication Setup
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;
