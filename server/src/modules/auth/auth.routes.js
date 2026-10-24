import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema } from './auth.validation.js';

const router = Router();

// GET /api/v1/auth/me - returns safe authenticated user profile
router.get('/me', requireAuth, authController.getMe);

// PATCH /api/v1/auth/profile - update permitted profile fields
router.patch('/profile', requireAuth, validate(updateProfileSchema), authController.updateProfile);

export default router;
