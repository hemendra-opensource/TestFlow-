import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { notificationIdParamSchema } from './notifications.validation.js';
import * as notificationsController from './notifications.controller.js';

export const notificationsRouter = express.Router();

notificationsRouter.use(requireAuth);

// GET /api/v1/notifications
notificationsRouter.get('/', notificationsController.listNotifications);

// GET /api/v1/notifications/unread-count
notificationsRouter.get('/unread-count', notificationsController.getUnreadCount);

// PATCH /api/v1/notifications/read-all
notificationsRouter.patch('/read-all', notificationsController.markAllAsRead);

// PATCH /api/v1/notifications/:notificationId/read
notificationsRouter.patch(
  '/:notificationId/read',
  validate(notificationIdParamSchema, 'params'),
  notificationsController.markAsRead
);

export default notificationsRouter;
