-- Migration: Phase 3 Project Management, Tasks & Kanban Board
-- Tables: projects, tasks
-- Constraints, indexes, validation triggers, and Row Level Security (RLS) policies.

-- ============================================================
-- 1. Projects Table
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

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);

-- Trigger for projects.updated_at
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 2. Tasks Table
-- ============================================================
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

-- Indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(project_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(project_id, status, position);

-- Trigger for tasks.updated_at
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. Helper Functions for Project & Task Authorization
-- ============================================================

-- Check if user is a member of the project's workspace
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

-- Get user's role in the project's workspace
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

-- Grant execution permissions on helper functions
REVOKE ALL ON FUNCTION public.is_project_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_project_role(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_project_role(UUID, UUID) TO authenticated;

-- ============================================================
-- 4. Assignee Cross-Workspace Validation Trigger
-- ============================================================
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
-- 5. Row Level Security (RLS) for projects
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- 6. Row Level Security (RLS) for tasks
-- ============================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

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
