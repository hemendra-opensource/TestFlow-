import * as notificationsService from './notifications.service.js';
import { successResponse } from '../../utils/response.js';

export const listNotifications = async (req, res, next) => {
  try {
    const { limit, offset, is_read } = req.query;
    const notifications = await notificationsService.listNotifications(
      req.scopedSupabase,
      req.user.id,
      { limit, offset, is_read }
    );
    return successResponse(res, notifications, 200, 'Notifications retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationsService.getUnreadCount(
      req.scopedSupabase,
      req.user.id
    );
    return successResponse(res, result, 200, 'Unread count retrieved successfully');
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const updated = await notificationsService.markNotificationAsRead(
      req.scopedSupabase,
      notificationId,
      req.user.id
    );
    return successResponse(res, updated, 200, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationsService.markAllNotificationsAsRead(
      req.scopedSupabase,
      req.user.id
    );
    return successResponse(res, result, 200, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
};
