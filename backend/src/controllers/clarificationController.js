import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { createNotification } from "../services/notificationService.js";
import { logAudit } from "../services/auditService.js";

export async function createClarification(req, res, next) {
  try {
    const { applicationId, assignedTo, clarificationType = "DOCUMENT", requestMessage } = req.body;

    if (!applicationId || !requestMessage) {
      return sendError(res, "Application ID and request message are required.", 400);
    }

    // Resolve assignedTo (applicant) if omitted
    let targetUserId = assignedTo;
    if (!targetUserId) {
      const [appRows] = await pool.execute(
        "SELECT applicant_user_id FROM applications WHERE application_id = ? LIMIT 1",
        [applicationId]
      );
      targetUserId = appRows[0]?.applicant_user_id;
    }

    if (!targetUserId) {
      return sendError(res, "Applicant for this application not found.", 404);
    }

    const [result] = await pool.execute(
      `INSERT INTO clarification_requests (
        application_id, raised_by, assigned_to, clarification_type,
        request_message, clarification_status, requested_at
      ) VALUES (?, ?, ?, ?, ?, 'OPEN', CURRENT_TIMESTAMP)`,
      [applicationId, req.user.user_id, targetUserId, clarificationType, requestMessage.trim()]
    );

    const clarificationId = result.insertId;

    await createNotification({
      userId: targetUserId,
      title: "Clarification Requested",
      message: `An admission officer has requested clarification on application ${applicationId}: "${requestMessage.slice(0, 100)}..."`,
      notificationType: "CLARIFICATION_REQUESTED",
    });

    await logAudit({
      userId: req.user.user_id,
      action: "CREATE_CLARIFICATION_REQUEST",
      entityName: "clarification_requests",
      entityId: clarificationId,
      newValues: { applicationId, clarificationType, requestMessage },
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Clarification request submitted.", { clarificationId }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function respondClarification(req, res, next) {
  try {
    const clarificationId = Number(req.params.id);
    const { applicantResponse } = req.body;

    if (!applicantResponse || !applicantResponse.trim()) {
      return sendError(res, "Response message cannot be empty.", 400);
    }

    const [rows] = await pool.execute(
      `SELECT clarification_id, application_id, raised_by, assigned_to, clarification_status
       FROM clarification_requests WHERE clarification_id = ? LIMIT 1`,
      [clarificationId]
    );

    const cr = rows[0];
    if (!cr) {
      return sendError(res, "Clarification request not found.", 404);
    }

    if (req.user.role_code === "APPLICANT" && cr.assigned_to !== req.user.user_id) {
      return sendError(res, "Access denied.", 403);
    }

    await pool.execute(
      `UPDATE clarification_requests
       SET applicant_response = ?, clarification_status = 'RESPONDED', responded_at = CURRENT_TIMESTAMP
       WHERE clarification_id = ?`,
      [applicantResponse.trim(), clarificationId]
    );

    await createNotification({
      userId: cr.raised_by,
      title: "Clarification Response Received",
      message: `Applicant has responded to clarification request #${clarificationId} on application #${cr.application_id}.`,
      notificationType: "CLARIFICATION_RESPONDED",
    });

    await logAudit({
      userId: req.user.user_id,
      action: "RESPOND_CLARIFICATION",
      entityName: "clarification_requests",
      entityId: clarificationId,
      newValues: { applicantResponse },
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Clarification response sent successfully.");
  } catch (error) {
    return next(error);
  }
}

export async function getClarificationsByApplication(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);

    const [rows] = await pool.execute(
      `SELECT cr.clarification_id, cr.application_id, cr.raised_by, cr.assigned_to,
              cr.clarification_type, cr.request_message, cr.applicant_response,
              cr.clarification_status, cr.requested_at, cr.responded_at,
              u1.full_name AS raised_by_name, u2.full_name AS assigned_to_name
       FROM clarification_requests cr
       LEFT JOIN users u1 ON cr.raised_by = u1.user_id
       LEFT JOIN users u2 ON cr.assigned_to = u2.user_id
       WHERE cr.application_id = ?
       ORDER BY cr.requested_at DESC`,
      [applicationId]
    );

    return sendSuccess(res, "Clarifications retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}
