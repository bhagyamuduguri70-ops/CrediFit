import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { checkEligibilityAutomatically, advanceStage } from "../services/screeningService.js";
import { logAudit } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

export async function runEligibilityCheck(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);
    const result = await checkEligibilityAutomatically({
      applicationId,
      evaluatedBy: req.user.user_id,
    });

    await logAudit({
      userId: req.user.user_id,
      action: "RUN_ELIGIBILITY_CHECK",
      entityName: "eligibility_evaluations",
      entityId: result.evaluationId,
      newValues: result,
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Eligibility evaluation completed.", result);
  } catch (error) {
    return next(error);
  }
}

export async function getEligibility(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);

    const [evalRows] = await pool.execute(
      `SELECT ee.evaluation_id, ee.application_id, ee.rule_id, ee.evaluated_by,
              ee.eligibility_status, ee.total_percentage, ee.remarks, ee.evaluated_at,
              er.minimum_percentage, er.qualification, er.rule_description,
              u.full_name AS evaluator_name
       FROM eligibility_evaluations ee
       JOIN eligibility_rules er ON ee.rule_id = er.rule_id
       LEFT JOIN users u ON ee.evaluated_by = u.user_id
       WHERE ee.application_id = ?
       ORDER BY ee.evaluated_at DESC
       LIMIT 1`,
      [applicationId]
    );

    const evaluation = evalRows[0];
    if (!evaluation) {
      return sendSuccess(res, "No eligibility evaluation recorded yet.", null);
    }

    const [checks] = await pool.execute(
      `SELECT check_id, check_name, expected_value, actual_value, check_status, remarks
       FROM eligibility_evaluation_checks
       WHERE evaluation_id = ?`,
      [evaluation.evaluation_id]
    );

    return sendSuccess(res, "Eligibility details retrieved.", {
      ...evaluation,
      checks,
    });
  } catch (error) {
    return next(error);
  }
}

export async function assignEvaluator(req, res, next) {
  try {
    const { applicationId, evaluatorUserId } = req.body;

    if (!applicationId || !evaluatorUserId) {
      return sendError(res, "Application ID and Evaluator User ID are required.", 400);
    }

    // Verify user is an EVALUATOR
    const [evalRows] = await pool.execute(
      `SELECT u.user_id, u.full_name, r.role_code 
       FROM users u 
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ? AND r.role_code = 'EVALUATOR' AND u.account_status = 'ACTIVE'`,
      [evaluatorUserId]
    );

    if (!evalRows[0]) {
      return sendError(res, "Selected user is not an active evaluator.", 400);
    }

    // Insert or update evaluator_assignments
    const [result] = await pool.execute(
      `INSERT INTO evaluator_assignments (application_id, evaluator_user_id, assigned_by, assignment_status, assigned_at)
       VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)`,
      [applicationId, evaluatorUserId, req.user.user_id]
    );

    await createNotification({
      userId: evaluatorUserId,
      title: "New Application Assigned",
      message: `You have been assigned to evaluate application ${applicationId}.`,
      notificationType: "EVALUATION_ASSIGNED",
    });

    await logAudit({
      userId: req.user.user_id,
      action: "ASSIGN_EVALUATOR",
      entityName: "evaluator_assignments",
      entityId: result.insertId,
      newValues: { applicationId, evaluatorUserId },
      ipAddress: req.ip,
    });

    return sendSuccess(res, `Evaluator ${evalRows[0].full_name} assigned successfully.`, {
      assignmentId: result.insertId,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getEvaluatorAssignments(req, res, next) {
  try {
    const evaluatorId = req.user.user_id;

    const [rows] = await pool.execute(
      `SELECT ea.assignment_id, ea.application_id, ea.assignment_status, ea.assigned_at,
              a.application_reference, a.programme_id, a.qualification, a.application_status, a.current_stage_id,
              u.full_name AS applicant_name, u.email AS applicant_email,
              p.programme_name, p.programme_code,
              dr.review_status, dr.recommendation
       FROM evaluator_assignments ea
       JOIN applications a ON ea.application_id = a.application_id
       JOIN users u ON a.applicant_user_id = u.user_id
       JOIN programmes p ON a.programme_id = p.programme_id
       LEFT JOIN department_reviews dr ON a.application_id = dr.application_id AND dr.evaluator_user_id = ea.evaluator_user_id
       WHERE ea.evaluator_user_id = ? AND ea.assignment_status != 'REVOKED'
       ORDER BY ea.assigned_at DESC`,
      [evaluatorId]
    );

    return sendSuccess(res, "Assigned applications retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function getProgrammeRubrics(req, res, next) {
  try {
    const programmeId = Number(req.params.programmeId);

    const [rubricRows] = await pool.execute(
      `SELECT rubric_id, programme_id, rubric_name, description, is_active
       FROM evaluation_rubrics
       WHERE programme_id = ? AND is_active = 1
       LIMIT 1`,
      [programmeId]
    );

    const rubric = rubricRows[0];
    if (!rubric) {
      return sendError(res, "No active evaluation rubric found for this programme.", 404);
    }

    const [criteria] = await pool.execute(
      `SELECT criterion_id, rubric_id, criterion_name, description, weight_percentage, is_active
       FROM rubric_criteria
       WHERE rubric_id = ? AND is_active = 1
       ORDER BY criterion_id ASC`,
      [rubric.rubric_id]
    );

    return sendSuccess(res, "Evaluation rubric retrieved.", {
      ...rubric,
      criteria,
    });
  } catch (error) {
    return next(error);
  }
}

export async function submitDepartmentReview(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const applicationId = Number(req.params.applicationId);
    const { rubricId, recommendation, remarks = "", conflictConfirmed = false, scores = [] } = req.body;

    if (!rubricId || !recommendation) {
      return sendError(res, "Rubric ID and recommendation are required.", 400);
    }

    if (!["RECOMMEND", "DO_NOT_RECOMMEND", "CLARIFICATION_REQUIRED"].includes(recommendation)) {
      return sendError(res, "Recommendation must be one of: RECOMMEND, DO_NOT_RECOMMEND, CLARIFICATION_REQUIRED.", 400);
    }

    await connection.beginTransaction();

    // Insert or update department_reviews
    const [existing] = await connection.execute(
      `SELECT department_review_id FROM department_reviews
       WHERE application_id = ? AND evaluator_user_id = ?
       LIMIT 1`,
      [applicationId, req.user.user_id]
    );

    let reviewId;
    if (existing[0]) {
      reviewId = existing[0].department_review_id;
      await connection.execute(
        `UPDATE department_reviews
         SET rubric_id = ?, review_status = 'SUBMITTED', recommendation = ?, remarks = ?,
             conflict_confirmed = ?, submitted_at = CURRENT_TIMESTAMP
         WHERE department_review_id = ?`,
        [rubricId, recommendation, remarks, conflictConfirmed ? 1 : 0, reviewId]
      );
    } else {
      const [insert] = await connection.execute(
        `INSERT INTO department_reviews (application_id, evaluator_user_id, rubric_id, review_status, recommendation, remarks, conflict_confirmed, submitted_at, created_at)
         VALUES (?, ?, ?, 'SUBMITTED', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [applicationId, req.user.user_id, rubricId, recommendation, remarks, conflictConfirmed ? 1 : 0]
      );
      reviewId = insert.insertId;
    }

    // Insert or update criterion scores
    for (const item of scores) {
      if (item.criterionId !== undefined && item.score !== undefined) {
        await connection.execute(
          `INSERT INTO department_review_scores (department_review_id, criterion_id, score, remarks)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE score = VALUES(score), remarks = VALUES(remarks)`,
          [reviewId, item.criterionId, Number(item.score), item.remarks || null]
        );
      }
    }

    // Update evaluator assignment status to COMPLETED
    await connection.execute(
      `UPDATE evaluator_assignments
       SET assignment_status = 'COMPLETED'
       WHERE application_id = ? AND evaluator_user_id = ?`,
      [applicationId, req.user.user_id]
    );

    // Record Stage 4: DEPARTMENT_REVIEW history and advance to Stage 5: FINAL_ADMISSION_DECISION
    const stagePassFail = recommendation === "RECOMMEND" ? "PASS" : recommendation === "DO_NOT_RECOMMEND" ? "FAIL" : "PENDING";
    await advanceStage({
      applicationId,
      nextStageId: 5,
      stageStatus: stagePassFail,
      changedBy: req.user.user_id,
      remarks: `Department review submitted: ${recommendation}. ${remarks}`,
      connection,
    });

    await logAudit({
      userId: req.user.user_id,
      action: "SUBMIT_DEPARTMENT_REVIEW",
      entityName: "department_reviews",
      entityId: reviewId,
      newValues: { recommendation, remarks, conflictConfirmed },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(res, "Department review submitted successfully.", { reviewId });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}
