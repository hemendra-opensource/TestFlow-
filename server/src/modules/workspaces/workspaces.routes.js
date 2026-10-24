import { Router } from 'express';
import { workspacesController } from './workspaces.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createWorkspaceSchema } from './workspaces.validation.js';

const router = Router();

// GET /api/v1/workspaces - return only workspaces the authenticated user belongs to
router.get('/', requireAuth, workspacesController.getWorkspaces);

// POST /api/v1/workspaces - create workspace and owner membership atomically
router.post('/', requireAuth, validate(createWorkspaceSchema), workspacesController.createWorkspace);

export default router;
