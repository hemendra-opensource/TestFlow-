import { Router } from 'express';
import { workspacesController } from './workspaces.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../../middleware/workspaceAuth.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from './workspaces.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────
// Collection routes
// ─────────────────────────────────────────────────────────

// GET /api/v1/workspaces — list only workspaces the authenticated user belongs to
router.get('/', requireAuth, workspacesController.getWorkspaces);

// POST /api/v1/workspaces — create workspace and owner membership atomically
router.post(
  '/',
  requireAuth,
  validate(createWorkspaceSchema),
  workspacesController.createWorkspace
);

// ─────────────────────────────────────────────────────────
// Member-scoped routes (all require verified workspace membership)
// ─────────────────────────────────────────────────────────

// GET /api/v1/workspaces/:workspaceId — fetch workspace details (any member)
router.get(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceMember,
  workspacesController.getWorkspaceById
);

// GET /api/v1/workspaces/:workspaceId/members — list workspace members (any member)
router.get(
  '/:workspaceId/members',
  requireAuth,
  requireWorkspaceMember,
  workspacesController.getWorkspaceMembers
);

// PATCH /api/v1/workspaces/:workspaceId — update workspace settings (admin+ only; slug change: owner only)
router.patch(
  '/:workspaceId',
  requireAuth,
  requireWorkspaceMember,
  requireWorkspaceRole('admin'),
  validate(updateWorkspaceSchema),
  workspacesController.updateWorkspace
);

export default router;
