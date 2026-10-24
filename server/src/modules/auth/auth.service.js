import { AppError } from '../../utils/appError.js';
import { logger } from '../../utils/logger.js';

export const authService = {
  /**
   * Retrieves profile for the authenticated user, enforcing RLS via the scoped client
   */
  async getCurrentUserProfile(user, scopedSupabase) {
    const { data: profile, error } = await scopedSupabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to retrieve user profile', error);
      throw new AppError('Failed to fetch user profile', 500);
    }

    // If profile row doesn't exist yet (e.g. edge case before trigger), return safe defaults
    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || '',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || null,
      created_at: profile?.created_at || user.created_at,
      updated_at: profile?.updated_at || user.updated_at,
    };
  },

  /**
   * Updates permitted profile fields (full_name, avatar_url)
   */
  async updateUserProfile(userId, updateData, scopedSupabase) {
    const payload = {};
    if (updateData.full_name !== undefined) payload.full_name = updateData.full_name;
    if (updateData.avatar_url !== undefined) payload.avatar_url = updateData.avatar_url;

    if (Object.keys(payload).length === 0) {
      throw new AppError('No valid profile fields provided for update', 400);
    }

    const { data, error } = await scopedSupabase
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select('id, full_name, avatar_url, created_at, updated_at')
      .single();

    if (error) {
      logger.error('Failed to update user profile', error);
      throw new AppError('Failed to update user profile', 500);
    }

    return data;
  },
};
