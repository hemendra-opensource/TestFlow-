import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

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
    const { data, error } = await scopedSupabase
      .from('workspace_members')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profile:profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch workspace members', error);
      throw new AppError('Failed to fetch workspace members', 500);
    }

    return (data || []).map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      full_name: m.profile?.full_name || null,
      avatar_url: m.profile?.avatar_url || null,
    }));
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
};
