import { Router } from 'express';
import { workspacesController } from './workspaces.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireWorkspaceMember, requireWorkspaceRole } from '../../middleware/workspaceAuth.js';
import { createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema } from './workspaces.validation.js';

const router = Router();

// ─────────────────────────────────────────────────────────
// Collection routes
// ─────────────────────────────────────────────────────────

// GET /api/v1/workspaces — list only workspaces the authenticated user belongs to
router.get('/', requireAuth, workspacesController.getWorkspaces);

// GET /api/v1/workspaces/users/registered — list all registered users for team invite lookup
router.get('/users/registered', requireAuth, workspacesController.getRegisteredUsers);

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

// POST /api/v1/workspaces/:workspaceId/members — add a member to workspace (admin+ only)
router.post(
  '/:workspaceId/members',
  requireAuth,
  requireWorkspaceMember,
  requireWorkspaceRole('admin'),
  validate(addMemberSchema),
  workspacesController.addWorkspaceMember
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
