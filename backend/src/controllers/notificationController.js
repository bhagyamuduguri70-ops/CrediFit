import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notificationService.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

export async function getNotifications(req, res, next) {
  try {
    const notifications = await getUserNotifications(req.user.user_id, req.query.limit || 50);
    return sendSuccess(res, "Notifications retrieved.", notifications);
  } catch (error) {
    return next(error);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notificationId = Number(req.params.id);
    const updated = await markNotificationAsRead(notificationId, req.user.user_id);
    if (!updated) {
      return sendError(res, "Notification not found.", 404);
    }
    return sendSuccess(res, "Notification marked as read.");
  } catch (error) {
    return next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    const count = await markAllNotificationsAsRead(req.user.user_id);
    return sendSuccess(res, `${count} notifications marked as read.`);
  } catch (error) {
    return next(error);
  }
}
