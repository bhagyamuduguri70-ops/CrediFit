import { pool } from "../config/db.js";

export async function logAudit({
  userId,
  action,
  entityName,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  connection = null,
}) {
  try {
    const executor = connection || pool;
    const oldValJson = oldValues ? JSON.stringify(oldValues) : null;
    const newValJson = newValues ? JSON.stringify(newValues) : null;

    await executor.execute(
      `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, old_values, new_values, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId || null, action, entityName, entityId || null, oldValJson, newValJson, ipAddress || null]
    );
  } catch (error) {
    console.error("[AuditLog Error]", error.message);
  }
}
