import { pool } from "../config/db.js";

export async function createNotification({
  userId,
  title,
  message,
  notificationType = "SYSTEM",
  connection = null,
}) {
  try {
    const executor = connection || pool;
    const [result] = await executor.execute(
      `INSERT INTO notifications (user_id, title, message, notification_type, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [userId, title, message, notificationType]
    );
    return result.insertId;
  } catch (error) {
    console.error("[Notification Error]", error.message);
    return null;
  }
}

export async function getUserNotifications(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT notification_id, user_id, title, message, notification_type, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, Number(limit)]
  );
  return rows;
}

export async function markNotificationAsRead(notificationId, userId) {
  const [result] = await pool.execute(
    `UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

export async function markAllNotificationsAsRead(userId) {
  const [result] = await pool.execute(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return result.affectedRows;
}
