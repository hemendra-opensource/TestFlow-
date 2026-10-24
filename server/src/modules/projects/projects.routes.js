import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  requireWorkspaceMember,
  requireWorkspaceRole,
  requireProjectMember,
} from '../../middleware/workspaceAuth.js';
import { validate } from '../../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
} from './projects.validation.js';
import * as projectsController from './projects.controller.js';

// Router for /api/v1/projects/:projectId
export const projectsRouter = express.Router();

projectsRouter.use(requireAuth);

projectsRouter.get(
  '/:projectId',
  requireProjectMember,
  projectsController.getProject
);

projectsRouter.patch(
  '/:projectId',
  requireProjectMember,
  requireWorkspaceRole('admin'),
  validate(updateProjectSchema),
  projectsController.updateProject
);

projectsRouter.delete(
  '/:projectId',
  requireProjectMember,
  requireWorkspaceRole('admin'),
  projectsController.deleteProject
);

// Router for mounting on /api/v1/workspaces/:workspaceId/projects
export const workspaceProjectsRouter = express.Router({ mergeParams: true });

workspaceProjectsRouter.use(requireAuth);

workspaceProjectsRouter.get(
  '/',
  requireWorkspaceMember,
  projectsController.listProjects
);

workspaceProjectsRouter.post(
  '/',
  requireWorkspaceMember,
  requireWorkspaceRole('admin'),
  validate(createProjectSchema),
  projectsController.createProject
);
