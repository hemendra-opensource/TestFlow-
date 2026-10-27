import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireWorkspaceMember } from '../../middleware/workspaceAuth.js';
import * as activityController from './activity.controller.js';

export const workspaceActivityRouter = express.Router({ mergeParams: true });

workspaceActivityRouter.use(requireAuth);

// GET /api/v1/workspaces/:workspaceId/activity
workspaceActivityRouter.get(
  '/',
  requireWorkspaceMember,
  activityController.getWorkspaceActivity
);

export default workspaceActivityRouter;
