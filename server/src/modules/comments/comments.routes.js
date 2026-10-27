import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  requireTaskMember,
  requireWorkspaceRole,
  requireCommentMember,
  requireCommentAuthor,
  requireCommentDeletePermission,
} from '../../middleware/workspaceAuth.js';
import { validate } from '../../middleware/validate.js';
import {
  createCommentSchema,
  updateCommentSchema,
} from './comments.validation.js';
import * as commentsController from './comments.controller.js';

// Router for /api/v1/tasks/:taskId/comments
export const taskCommentsRouter = express.Router({ mergeParams: true });

taskCommentsRouter.use(requireAuth);

taskCommentsRouter.get(
  '/',
  requireTaskMember,
  commentsController.listComments
);

taskCommentsRouter.post(
  '/',
  requireTaskMember,
  requireWorkspaceRole('member'),
  validate(createCommentSchema),
  commentsController.createComment
);

// Router for /api/v1/comments/:commentId
export const commentsRouter = express.Router();

commentsRouter.use(requireAuth);

commentsRouter.patch(
  '/:commentId',
  requireCommentMember,
  requireCommentAuthor,
  validate(updateCommentSchema),
  commentsController.updateComment
);

commentsRouter.delete(
  '/:commentId',
  requireCommentMember,
  requireCommentDeletePermission,
  commentsController.deleteComment
);

export default commentsRouter;
