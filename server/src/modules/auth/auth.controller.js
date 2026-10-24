import { authService } from './auth.service.js';
import { successResponse } from '../../utils/response.js';

export const authController = {
  getMe: async (req, res, next) => {
    try {
      const profile = await authService.getCurrentUserProfile(req.user, req.scopedSupabase);
      return successResponse(res, profile, 200);
    } catch (err) {
      next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const updatedProfile = await authService.updateUserProfile(
        req.user.id,
        req.body,
        req.scopedSupabase
      );
      return successResponse(res, updatedProfile, 200, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  },
};
