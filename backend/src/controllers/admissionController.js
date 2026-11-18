import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

export async function recordFinalDecision(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const applicationId = Number(req.params.applicationId);
    const { decision, remarks = "" } = req.body;

    const normalizedDecision =
      decision === "NOT_ADMITTED" ? "REJECTED" : decision === "PROVISIONAL" ? "WAITLISTED" : decision;

    if (!normalizedDecision || !["ADMITTED", "REJECTED", "WAITLISTED"].includes(normalizedDecision)) {
      return sendError(res, "Decision must be one of: ADMITTED, NOT_ADMITTED (or REJECTED), WAITLISTED.", 400);
    }

    const safeRemarks = (remarks && remarks.trim()) ? remarks.trim() : `Decision: ${normalizedDecision}`;

    await connection.beginTransaction();

    const [appRows] = await connection.execute(
      `SELECT a.application_id, a.applicant_user_id, a.programme_id, a.current_stage_id,
              p.programme_name
       FROM applications a
       JOIN programmes p ON a.programme_id = p.programme_id
       WHERE a.application_id = ?
       LIMIT 1`,
      [applicationId]
    );

    const app = appRows[0];
    if (!app) {
      return sendError(res, "Application not found.", 404);
    }

    // Insert or update final_decisions
    const [existing] = await connection.execute(
      "SELECT decision_id FROM final_decisions WHERE application_id = ? LIMIT 1",
      [applicationId]
    );

    let decisionId;
    if (existing[0]) {
      decisionId = existing[0].decision_id;
      await connection.execute(
        `UPDATE final_decisions
         SET decided_by = ?, decision = ?, remarks = ?, decision_date = CURRENT_TIMESTAMP
         WHERE decision_id = ?`,
        [req.user.user_id, normalizedDecision, safeRemarks, decisionId]
      );
    } else {
      const [insert] = await connection.execute(
        `INSERT INTO final_decisions (application_id, decided_by, decision, remarks, decision_date)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [applicationId, req.user.user_id, normalizedDecision, safeRemarks]
      );
      decisionId = insert.insertId;
    }

    // Update application status: COMPLETED (decision is recorded in final_decisions)
    await connection.execute(
      `UPDATE applications
       SET application_status = 'COMPLETED', current_stage_id = 5, updated_at = CURRENT_TIMESTAMP
       WHERE application_id = ?`,
      [applicationId]
    );

    // Record stage 5 history
    const stageStatus = normalizedDecision === "ADMITTED" ? "PASS" : normalizedDecision === "REJECTED" ? "FAIL" : "PENDING";
    await connection.execute(
      `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
       VALUES (?, 5, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [applicationId, stageStatus, req.user.user_id, `Final decision recorded: ${normalizedDecision}. ${safeRemarks}`]
    );

    // Notify applicant
    const notificationMsg =
      normalizedDecision === "ADMITTED"
        ? `Congratulations! You have been offered admission for ${app.programme_name}.`
        : `Your application for ${app.programme_name} has received a final decision: ${normalizedDecision}.`;

    await createNotification({
      userId: app.applicant_user_id,
      title: "Admission Decision Announced",
      message: notificationMsg,
      notificationType: "FINAL_DECISION",
      connection,
    });

    await logAudit({
      userId: req.user.user_id,
      action: "RECORD_FINAL_DECISION",
      entityName: "final_decisions",
      entityId: decisionId,
      newValues: { decision: normalizedDecision, remarks: safeRemarks, applicationStatus: "COMPLETED" },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(res, `Final decision '${normalizedDecision}' recorded successfully.`, {
      decisionId,
      decision: normalizedDecision,
      applicationStatus: "COMPLETED",
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getFinalDecision(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);

    const [rows] = await pool.execute(
      `SELECT fd.decision_id, fd.application_id, fd.decided_by, fd.decision, fd.remarks, fd.decision_date,
              u.full_name AS decided_by_name,
              p.programme_name, p.programme_code
       FROM final_decisions fd
       JOIN users u ON fd.decided_by = u.user_id
       JOIN applications a ON fd.application_id = a.application_id
       JOIN programmes p ON a.programme_id = p.programme_id
       WHERE fd.application_id = ?
       LIMIT 1`,
      [applicationId]
    );

    return sendSuccess(res, "Final decision retrieved.", rows[0] || null);
  } catch (error) {
    return next(error);
  }
}

export async function getMeritList(req, res, next) {
  try {
    const programmeId = req.query.programmeId ? Number(req.query.programmeId) : null;
    let query = `
      SELECT 
        a.application_id,
        a.application_reference,
        a.application_status,
        a.current_stage_id,
        s.stage_name,
        u.user_id,
        u.full_name AS applicant_name,
        u.email,
        ap.category,
        p.programme_id,
        p.programme_code,
        p.programme_name,
        COALESCE(er.percentage, 0) AS academic_percentage,
        COALESCE(se.avg_eval_score, 0) AS evaluation_score,
        ROUND((COALESCE(er.percentage, 0) * 0.6 + COALESCE(se.avg_eval_score, 0) * 0.4), 2) AS composite_merit_score,
        fd.decision AS final_decision,
        fd.decision_date
      FROM applications a
      JOIN users u ON a.applicant_user_id = u.user_id
      LEFT JOIN applicant_profiles ap ON u.user_id = ap.user_id
      JOIN programmes p ON a.programme_id = p.programme_id
      JOIN application_stages s ON a.current_stage_id = s.stage_id
      LEFT JOIN (
        SELECT user_id, MAX(percentage) AS percentage
        FROM education_records
        GROUP BY user_id
      ) er ON u.user_id = er.user_id
      LEFT JOIN (
        SELECT application_id, AVG(total_score) AS avg_eval_score
        FROM stage_evaluations
        GROUP BY application_id
      ) se ON a.application_id = se.application_id
      LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
      WHERE a.application_status != 'DRAFT'
    `;
    const params = [];
    if (programmeId) {
      query += ` AND a.programme_id = ?`;
      params.push(programmeId);
    }
    query += ` ORDER BY composite_merit_score DESC, academic_percentage DESC`;
    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "Merit list retrieved successfully.", rows);
  } catch (error) {
    return next(error);
  }
}
