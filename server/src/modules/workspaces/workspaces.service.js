import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';
import { getSupabaseAdminClient } from '../../config/supabase.js';
import { logActivity } from '../activity/activity.service.js';
import { createNotification } from '../notifications/notifications.service.js';

export const workspacesService = {
  /**
   * Retrieves all workspaces that the authenticated user belongs to.
   * RLS automatically isolates workspaces and memberships.
   */
  async getUserWorkspaces(userId, scopedSupabase) {
    const { data, error } = await scopedSupabase
      .from('workspace_members')
      .select(`
        role,
        joined_at,
        workspace:workspaces (
          id,
          name,
          slug,
          description,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      logger.error('Failed to query user workspaces', error);
      throw new AppError('Failed to fetch workspaces', 500);
    }

    return (data || [])
      .filter((item) => item.workspace !== null)
      .map((item) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        slug: item.workspace.slug,
        description: item.workspace.description || null,
        created_by: item.workspace.created_by,
        created_at: item.workspace.created_at,
        updated_at: item.workspace.updated_at,
        role: item.role,
        joined_at: item.joined_at,
      }));
  },

  /**
   * Fetches a single workspace by ID.
   * RLS enforced: scoped client returns null if user is not a member.
   */
  async getWorkspaceById(workspaceId, userId, scopedSupabase) {
    const { data: workspace, error } = await scopedSupabase
      .from('workspaces')
      .select('id, name, slug, description, created_by, created_at, updated_at')
      .eq('id', workspaceId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch workspace by ID', error);
      throw new AppError('Failed to fetch workspace', 500);
    }

    if (!workspace) {
      throw new AppError('Workspace not found or access denied', 404);
    }

    // Fetch caller's role from membership (already verified by middleware)
    const { data: membership } = await scopedSupabase
      .from('workspace_members')
      .select('role, joined_at')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();

    return {
      ...workspace,
      description: workspace.description || null,
      role: membership?.role || null,
      joined_at: membership?.joined_at || null,
    };
  },

  /**
   * Fetches members of a workspace.
   * RLS enforced: scoped client hides workspaces the user isn't a member of.
   * Policy: all members can view member list (owners/admins can see full details).
   */
  async getWorkspaceMembers(workspaceId, scopedSupabase) {
    const { data: members, error } = await scopedSupabase
      .from('workspace_members')
      .select('id, role, joined_at, user_id')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch workspace members', error);
      throw new AppError('Failed to fetch workspace members', 500);
    }

    const userIds = Array.from(new Set((members || []).map((m) => m.user_id).filter(Boolean)));
    let profileMap = new Map();

    if (userIds.length > 0) {
      const { data: profiles, error: profError } = await scopedSupabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (!profError && profiles) {
        profileMap = new Map(profiles.map((p) => [p.id, p]));
      }
    }

    return (members || []).map((m) => {
      const prof = profileMap.get(m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: prof?.full_name || null,
        avatar_url: prof?.avatar_url || null,
      };
    });
  },

  /**
   * Updates workspace fields (name, slug, description).
   * Slug changes are restricted to owners only — enforced here.
   */
  async updateWorkspace(workspaceId, updates, callerRole, scopedSupabase) {
    if (updates.slug && callerRole !== 'owner') {
      throw new AppError('Only the workspace owner can change the slug', 403);
    }

    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.description !== undefined) payload.description = updates.description;

    const { data, error } = await scopedSupabase
      .from('workspaces')
      .update(payload)
      .eq('id', workspaceId)
      .select('id, name, slug, description, created_by, created_at, updated_at')
      .single();

    if (error) {
      logger.warn('Failed to update workspace', { code: error.code, message: error.message });
      if (error.code === '23505') {
        throw new AppError('A workspace with this slug already exists', 409);
      }
      if (error.code === '42501') {
        throw new AppError('Insufficient permissions to update workspace', 403);
      }
      throw new AppError('Failed to update workspace', 500);
    }

    return data;
  },

  /**
   * Atomically creates a workspace and sets the creator as owner using the PostgreSQL function.
   */
  async createWorkspace(name, slug, description, user, scopedSupabase) {
    const { data, error } = await scopedSupabase.rpc('create_workspace_with_owner', {
      p_name: name,
      p_slug: slug,
      p_description: description ?? null,
    });

    if (error) {
      logger.warn('Failed to create workspace via RPC', { code: error.code, message: error.message });

      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('already exists')) {
        throw new AppError('A workspace with this slug already exists. Please choose a different slug.', 409);
      }
      if (error.code === '22023') {
        throw new AppError(error.message, 400);
      }
      if (error.code === '42501') {
        throw new AppError('Unauthorized: Unable to create workspace', 403);
      }
      throw new AppError('Failed to create workspace', 500);
    }

    return data;
  },

  /**
   * Adds a member to a workspace by user email.
   * Admin/Owner only.
   */
  async addWorkspaceMember(workspaceId, { email, role = 'member' }, callerUser, scopedSupabase) {
    const admin = getSupabaseAdminClient();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Lookup user by email in auth
    const { data: usersData, error: userError } = await admin.auth.admin.listUsers();
    if (userError) {
      logger.error('Failed to list users in addWorkspaceMember', userError);
      throw new AppError('Failed to lookup user', 500);
    }

    const targetUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase().trim() === cleanEmail
    );

    if (!targetUser) {
      throw new AppError(
        `User with email "${email}" is not registered on TeamFlow. Please ask them to sign up first.`,
        404
      );
    }

    // 2. Check if already a member
    const { data: existingMember } = await scopedSupabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (existingMember) {
      throw new AppError('This user is already a member of this workspace.', 409);
    }

    // 3. Insert membership
    const { data: newMember, error: insertError } = await admin
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: targetUser.id,
        role,
      })
      .select('id, user_id, role, joined_at')
      .single();

    if (insertError) {
      logger.error('Failed to insert workspace member', insertError);
      throw new AppError('Failed to add workspace member', 500);
    }

    // 4. Fetch profile
    const { data: profile } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', targetUser.id)
      .maybeSingle();

    // 5. Log workspace activity
    await logActivity({
      workspaceId,
      actorId: callerUser.id,
      entityType: 'workspace_member',
      entityId: newMember.id,
      action: 'added',
      metadata: {
        member_email: targetUser.email,
        member_name: profile?.full_name || targetUser.email.split('@')[0],
        role,
      },
    });

    // 6. Notify the user
    await createNotification({
      recipient_id: targetUser.id,
      workspace_id: workspaceId,
      actor_id: callerUser.id,
      type: 'workspace_invite',
      title: 'Added to Workspace',
      message: `You were added to the workspace as a ${role}.`,
      entity_type: 'workspace',
      entity_id: workspaceId,
    });

    return {
      id: newMember.id,
      user_id: newMember.user_id,
      role: newMember.role,
      joined_at: newMember.joined_at,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      email: targetUser.email,
    };
  },

  /**
   * Returns list of registered users for quick member selection
   */
  async getRegisteredUsers() {
    const admin = getSupabaseAdminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const users = usersData?.users || [];
    const userIds = users.map((u) => u.id);
    let profileMap = new Map();
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);
      profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    }
    return users.map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        full_name: p?.full_name || null,
        avatar_url: p?.avatar_url || null,
      };
    });
  },
};
