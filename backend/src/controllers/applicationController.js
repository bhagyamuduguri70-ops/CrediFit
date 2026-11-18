import crypto from "node:crypto";
import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { advanceStage } from "../services/screeningService.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

function generateAppReference() {
  const year = new Date().getFullYear();
  const rand = crypto.randomInt(10000, 99999);
  return `CF-${year}-${rand}`;
}

export async function createApplication(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const { programmeId, cycleId, qualification = "12TH", personalStatement = "" } = req.body;

    if (!programmeId) {
      return sendError(res, "Programme selection is required.", 400);
    }

    await connection.beginTransaction();

    // Verify programme exists and is active
    const [progRows] = await connection.execute(
      "SELECT programme_id, programme_name FROM programmes WHERE programme_id = ? AND programme_status = 'ACTIVE'",
      [programmeId]
    );

    if (!progRows[0]) {
      return sendError(res, "Selected programme is invalid or not active.", 400);
    }

    // Determine admission cycle
    let resolvedCycleId = cycleId;
    if (!resolvedCycleId) {
      const [cycleRows] = await connection.execute(
        "SELECT cycle_id FROM admission_cycles WHERE cycle_status = 'ACTIVE' ORDER BY start_date DESC LIMIT 1"
      );
      resolvedCycleId = cycleRows[0]?.cycle_id || 1;
    }

    // Prevent duplicate active application for same programme and cycle
    const [existing] = await connection.execute(
      `SELECT application_id, application_status FROM applications
       WHERE applicant_user_id = ? AND programme_id = ? AND cycle_id = ?
       LIMIT 1`,
      [userId, programmeId, resolvedCycleId]
    );

    if (existing[0]) {
      return sendError(
        res,
        `You already have an existing application (${existing[0].application_id}) for this programme in the current cycle.`,
        409
      );
    }

    const appRef = generateAppReference();

    // Stage 1: APPLICATION_SUBMISSION (stage_id: 1)
    const [result] = await connection.execute(
      `INSERT INTO applications (
        application_reference, applicant_user_id, programme_id, cycle_id,
        current_stage_id, qualification, personal_statement, application_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [appRef, userId, programmeId, resolvedCycleId, qualification, personalStatement]
    );

    const applicationId = result.insertId;

    // Record initial stage history
    await connection.execute(
      `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
       VALUES (?, 1, 'IN_PROGRESS', ?, 'Application draft created by applicant.', CURRENT_TIMESTAMP)`,
      [applicationId, userId]
    );

    await logAudit({
      userId,
      action: "CREATE_APPLICATION_DRAFT",
      entityName: "applications",
      entityId: applicationId,
      newValues: { reference: appRef, programmeId, resolvedCycleId },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(
      res,
      "Application draft created successfully.",
      {
        applicationId,
        applicationReference: appRef,
        applicationStatus: "DRAFT",
        currentStageId: 1,
      },
      201
    );
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function submitApplication(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const applicationId = Number(req.params.id);
    const userId = req.user.user_id;

    await connection.beginTransaction();

    const [appRows] = await connection.execute(
      `SELECT a.application_id, a.applicant_user_id, a.programme_id, a.application_status, a.current_stage_id,
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

    if (req.user.role_code === "APPLICANT" && app.applicant_user_id !== userId) {
      return sendError(res, "Access denied.", 403);
    }

    if (app.application_status !== "DRAFT") {
      return sendError(res, `Application cannot be submitted because it is already '${app.application_status}'.`, 400);
    }

    // Verify applicant has at least one education record
    const [eduRows] = await connection.execute(
      "SELECT education_record_id FROM education_records WHERE user_id = ? LIMIT 1",
      [app.applicant_user_id]
    );

    if (eduRows.length === 0) {
      return sendError(res, "Please add your educational qualification records before submitting your application.", 400);
    }

    // Update application to SUBMITTED and advance to Stage 2: DOCUMENT_VERIFICATION
    await connection.execute(
      `UPDATE applications
       SET application_status = 'SUBMITTED',
           current_stage_id = 2,
           submitted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE application_id = ?`,
      [applicationId]
    );

    // Record stage 1 completed (PASS)
    await connection.execute(
      `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
       VALUES (?, 1, 'PASS', ?, 'Application formally submitted by applicant.', CURRENT_TIMESTAMP)`,
      [applicationId, userId]
    );

    // Record stage 2 queued (PENDING)
    await connection.execute(
      `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
       VALUES (?, 2, 'PENDING', ?, 'Awaiting document upload and admission officer verification.', CURRENT_TIMESTAMP)`,
      [applicationId, userId]
    );

    await createNotification({
      userId: app.applicant_user_id,
      title: "Application Submitted Successfully",
      message: `Your application ${applicationId} for ${app.programme_name} has been submitted. Next step: Document Verification.`,
      notificationType: "APPLICATION_SUBMITTED",
      connection,
    });

    await logAudit({
      userId,
      action: "SUBMIT_APPLICATION",
      entityName: "applications",
      entityId: applicationId,
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(res, "Application submitted successfully for document verification.");
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const userId = req.user.user_id;

    const [rows] = await pool.execute(
      `SELECT a.application_id, a.application_reference, a.programme_id, a.cycle_id,
              a.current_stage_id, a.qualification, a.personal_statement, a.application_status,
              a.submitted_at, a.created_at,
              p.programme_code, p.programme_name, p.duration_years,
              ac.cycle_name, ac.academic_year,
              s.stage_code, s.stage_name, s.stage_order,
              fd.decision AS final_decision, fd.decision_date AS final_decision_date
       FROM applications a
       JOIN programmes p ON a.programme_id = p.programme_id
       JOIN admission_cycles ac ON a.cycle_id = ac.cycle_id
       JOIN application_stages s ON a.current_stage_id = s.stage_id
       LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
       WHERE a.applicant_user_id = ?
       ORDER BY a.created_at DESC`,
      [userId]
    );

    return sendSuccess(res, "My applications retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function getAllApplications(req, res, next) {
  try {
    const {
      programmeId,
      stageId,
      status,
      cycleId,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    let query = `
      SELECT a.application_id, a.application_reference, a.applicant_user_id, a.programme_id,
             a.current_stage_id, a.qualification, a.application_status, a.submitted_at, a.created_at,
             u.full_name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone,
             p.programme_code, p.programme_name,
             ac.cycle_name, ac.academic_year,
             s.stage_code, s.stage_name, s.stage_order,
             fd.decision AS final_decision
      FROM applications a
      JOIN users u ON a.applicant_user_id = u.user_id
      JOIN programmes p ON a.programme_id = p.programme_id
      JOIN admission_cycles ac ON a.cycle_id = ac.cycle_id
      JOIN application_stages s ON a.current_stage_id = s.stage_id
      LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
      WHERE 1=1
    `;

    const params = [];

    if (programmeId) {
      query += ` AND a.programme_id = ? `;
      params.push(Number(programmeId));
    }

    if (stageId) {
      query += ` AND a.current_stage_id = ? `;
      params.push(Number(stageId));
    }

    if (status) {
      query += ` AND a.application_status = ? `;
      params.push(status);
    }

    if (cycleId) {
      query += ` AND a.cycle_id = ? `;
      params.push(Number(cycleId));
    }

    if (search && search.trim()) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR a.application_reference LIKE ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ? `;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "Applications retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function getApplicationById(req, res, next) {
  try {
    const applicationId = Number(req.params.id);

    const [appRows] = await pool.execute(
      `SELECT a.application_id, a.application_reference, a.applicant_user_id, a.programme_id,
              a.cycle_id, a.current_stage_id, a.qualification, a.personal_statement,
              a.application_status, a.submitted_at, a.created_at, a.updated_at,
              u.full_name AS applicant_name, u.email AS applicant_email, u.phone AS applicant_phone,
              p.programme_code, p.programme_name, p.duration_years,
              ac.cycle_name, ac.academic_year,
              s.stage_code, s.stage_name, s.stage_order
       FROM applications a
       JOIN users u ON a.applicant_user_id = u.user_id
       JOIN programmes p ON a.programme_id = p.programme_id
       JOIN admission_cycles ac ON a.cycle_id = ac.cycle_id
       JOIN application_stages s ON a.current_stage_id = s.stage_id
       WHERE a.application_id = ?
       LIMIT 1`,
      [applicationId]
    );

    const application = appRows[0];
    if (!application) {
      return sendError(res, "Application not found.", 404);
    }

    // Role check: applicants can only view their own
    if (req.user.role_code === "APPLICANT" && application.applicant_user_id !== req.user.user_id) {
      return sendError(res, "Access denied.", 403);
    }

    // Evaluators can only view if assigned
    if (req.user.role_code === "EVALUATOR") {
      const [assignRows] = await pool.execute(
        `SELECT assignment_id FROM evaluator_assignments
         WHERE application_id = ? AND evaluator_user_id = ? AND assignment_status != 'REVOKED'
         LIMIT 1`,
        [applicationId, req.user.user_id]
      );
      if (!assignRows[0]) {
        return sendError(res, "You are not assigned to evaluate this application.", 403);
      }
    }

    // Fetch documents
    const [docs] = await pool.execute(
      `SELECT ad.document_id, ad.application_id, ad.document_type_id, ad.uploaded_by,
              ad.original_filename, ad.stored_filename, ad.file_path, ad.file_type,
              ad.file_size, ad.upload_status, ad.uploaded_at,
              dt.document_code, dt.document_name,
              dr.decision AS review_decision, dr.remarks AS review_remarks
       FROM application_documents ad
       JOIN document_types dt ON ad.document_type_id = dt.document_type_id
       LEFT JOIN document_reviews dr ON ad.document_id = dr.document_id
       WHERE ad.application_id = ?
       ORDER BY ad.uploaded_at DESC`,
      [applicationId]
    );

    // Fetch education records
    const [eduRecords] = await pool.execute(
      `SELECT education_record_id, qualification, institution, board, year_of_passing,
              marks_obtained, maximum_marks, percentage
       FROM education_records
       WHERE user_id = ?
       ORDER BY year_of_passing DESC`,
      [applicationId ? application.applicant_user_id : 0]
    );

    // Fetch stage history
    const [stageHistory] = await pool.execute(
      `SELECT ash.history_id, ash.stage_id, ash.stage_status, ash.changed_by, ash.remarks, ash.changed_at,
              s.stage_code, s.stage_name, s.stage_order,
              u.full_name AS changed_by_name
       FROM application_stage_history ash
       JOIN application_stages s ON ash.stage_id = s.stage_id
       LEFT JOIN users u ON ash.changed_by = u.user_id
       WHERE ash.application_id = ?
       ORDER BY ash.changed_at ASC`,
      [applicationId]
    );

    // Fetch eligibility evaluation
    const [evaluations] = await pool.execute(
      `SELECT ee.evaluation_id, ee.rule_id, ee.evaluated_by, ee.eligibility_status,
              ee.total_percentage, ee.remarks, ee.evaluated_at,
              er.minimum_percentage, er.qualification AS rule_qualification,
              u.full_name AS evaluated_by_name
       FROM eligibility_evaluations ee
       JOIN eligibility_rules er ON ee.rule_id = er.rule_id
       LEFT JOIN users u ON ee.evaluated_by = u.user_id
       WHERE ee.application_id = ?
       ORDER BY ee.evaluated_at DESC LIMIT 1`,
      [applicationId]
    );

    // Fetch department review (if any)
    const [reviews] = await pool.execute(
      `SELECT dr.department_review_id, dr.evaluator_user_id, dr.rubric_id, dr.review_status,
              dr.recommendation, dr.remarks, dr.submitted_at,
              u.full_name AS evaluator_name,
              er.rubric_name
       FROM department_reviews dr
       JOIN users u ON dr.evaluator_user_id = u.user_id
       JOIN evaluation_rubrics er ON dr.rubric_id = er.rubric_id
       WHERE dr.application_id = ?
       LIMIT 1`,
      [applicationId]
    );

    // Fetch final decision
    const [decisionRows] = await pool.execute(
      `SELECT fd.decision_id, fd.decided_by, fd.decision, fd.remarks, fd.decision_date,
              u.full_name AS decided_by_name
       FROM final_decisions fd
       JOIN users u ON fd.decided_by = u.user_id
       WHERE fd.application_id = ?
       LIMIT 1`,
      [applicationId]
    );

    return sendSuccess(res, "Application details retrieved.", {
      ...application,
      documents: docs,
      educationRecords: eduRecords,
      stageHistory,
      eligibilityEvaluation: evaluations[0] || null,
      departmentReview: reviews[0] || null,
      finalDecision: decisionRows[0] || null,
    });
  } catch (error) {
    return next(error);
  }
}
