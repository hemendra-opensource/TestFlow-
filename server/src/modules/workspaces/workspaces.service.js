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

    // Format output cleanly, filtering out any null workspaces (in case of orphaned records)
    return (data || [])
      .filter((item) => item.workspace !== null)
      .map((item) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        slug: item.workspace.slug,
        created_by: item.workspace.created_by,
        created_at: item.workspace.created_at,
        updated_at: item.workspace.updated_at,
        role: item.role,
        joined_at: item.joined_at,
      }));
  },

  /**
   * Atomically creates a workspace and sets the creator as owner using the PostgreSQL function.
   * Prevents client-driven role manipulation and maintains ACID transaction safety.
   */
  async createWorkspace(name, slug, user, scopedSupabase) {
    // 1. Invoke PostgreSQL function create_workspace_with_owner
    const { data, error } = await scopedSupabase.rpc('create_workspace_with_owner', {
      p_name: name,
      p_slug: slug,
    });

    if (error) {
      logger.warn('Failed to create workspace via RPC', { code: error.code, message: error.message });

      // Handle duplicate slug collision
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
