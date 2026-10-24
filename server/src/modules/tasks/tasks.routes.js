import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  requireProjectMember,
  requireTaskMember,
  requireWorkspaceRole,
  requireTaskDeletePermission,
} from '../../middleware/workspaceAuth.js';
import { validate } from '../../middleware/validate.js';
import { createTaskSchema, updateTaskSchema } from './tasks.validation.js';
import * as tasksController from './tasks.controller.js';

// Router for /api/v1/tasks/:taskId
export const tasksRouter = express.Router();

tasksRouter.use(requireAuth);

tasksRouter.get(
  '/:taskId',
  requireTaskMember,
  tasksController.getTask
);

tasksRouter.patch(
  '/:taskId',
  requireTaskMember,
  requireWorkspaceRole('member'), // viewers cannot update tasks
  validate(updateTaskSchema),
  tasksController.updateTask
);

tasksRouter.delete(
  '/:taskId',
  requireTaskMember,
  requireTaskDeletePermission,
  tasksController.deleteTask
);

// Router for mounting on /api/v1/projects/:projectId/tasks
export const projectTasksRouter = express.Router({ mergeParams: true });

projectTasksRouter.use(requireAuth);

projectTasksRouter.get(
  '/',
  requireProjectMember,
  tasksController.listTasks
);

projectTasksRouter.post(
  '/',
  requireProjectMember,
  requireWorkspaceRole('member'), // viewers cannot create tasks
  validate(createTaskSchema),
  tasksController.createTask
);
