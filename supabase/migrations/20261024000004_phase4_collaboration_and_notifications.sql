-- Migration: Phase 4 Real-Time Collaboration, Comments & Notifications
-- Tables: task_comments, notifications, activity_logs
-- Constraints, indexes, validation triggers, Row Level Security (RLS) policies, and Realtime publications.

-- ============================================================
-- 1. task_comments Table
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

-- Indexes for task_comments
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author_id ON public.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.task_comments(task_id, created_at ASC);

-- Trigger for task_comments.updated_at
DROP TRIGGER IF EXISTS set_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER set_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Helper function: is_task_member
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

-- Helper function: get_task_role
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

-- Grant execution permissions
REVOKE ALL ON FUNCTION public.is_task_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_task_member(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.get_task_role(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_task_role(UUID, UUID) TO authenticated;

-- Row Level Security (RLS) for task_comments
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

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
  USING (
    author_id = auth.uid()
    AND public.is_task_member(task_id, auth.uid())
  )
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_task_member(task_id, auth.uid())
  );

DROP POLICY IF EXISTS "Authors and admins can delete task comments" ON public.task_comments;
CREATE POLICY "Authors and admins can delete task comments"
  ON public.task_comments FOR DELETE TO authenticated
  USING (
    public.is_task_member(task_id, auth.uid())
    AND (
      author_id = auth.uid()
      OR public.get_task_role(task_id, auth.uid()) IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 2. notifications Table
-- ============================================================
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

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON public.notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, is_read, created_at DESC);

-- Row Level Security (RLS) for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- 3. activity_logs Table
-- ============================================================
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

-- Indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id ON public.activity_logs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Row Level Security (RLS) for activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace members can view activity logs" ON public.activity_logs;
CREATE POLICY "Workspace members can view activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Activity logs are read-only for normal users; created via trusted backend service-role operations.

-- ============================================================
-- 4. Supabase Realtime Publication Setup
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.task_comments;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;
