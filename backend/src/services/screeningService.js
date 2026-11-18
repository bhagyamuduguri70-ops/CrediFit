import { pool } from "../config/db.js";
import { logAudit } from "./auditService.js";
import { createNotification } from "./notificationService.js";

export async function advanceStage({
  applicationId,
  nextStageId,
  stageStatus,
  changedBy,
  remarks = "",
  connection = null,
}) {
  const executor = connection || pool;

  // Update application current stage
  await executor.execute(
    `UPDATE applications 
     SET current_stage_id = ?, updated_at = CURRENT_TIMESTAMP
     WHERE application_id = ?`,
    [nextStageId, applicationId]
  );

  // Insert into application_stage_history
  await executor.execute(
    `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [applicationId, nextStageId, stageStatus, changedBy, remarks]
  );
}

export async function checkEligibilityAutomatically({
  applicationId,
  evaluatedBy,
  connection = null,
}) {
  const executor = connection || pool;

  // Fetch application details
  const [apps] = await executor.execute(
    `SELECT a.application_id, a.applicant_user_id, a.programme_id, a.qualification,
            p.programme_name, p.programme_code
     FROM applications a
     JOIN programmes p ON a.programme_id = p.programme_id
     WHERE a.application_id = ?
     LIMIT 1`,
    [applicationId]
  );

  const app = apps[0];
  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  // Fetch matching eligibility rule for this programme and qualification
  const [rules] = await executor.execute(
    `SELECT rule_id, programme_id, qualification, minimum_percentage, rule_description
     FROM eligibility_rules
     WHERE programme_id = ? AND is_active = 1
     ORDER BY minimum_percentage ASC`,
    [app.programme_id]
  );

  if (rules.length === 0) {
    return {
      success: false,
      status: "INCOMPLETE",
      message: "No active eligibility rules configured for this programme.",
    };
  }

  // Find most relevant rule matching qualification or default to first
  const rule = rules.find((r) => r.qualification.toUpperCase() === app.qualification.toUpperCase()) || rules[0];

  // Fetch applicant's education records
  const [eduRecords] = await executor.execute(
    `SELECT education_record_id, qualification, year_of_passing, marks_obtained, maximum_marks, percentage
     FROM education_records
     WHERE user_id = ?
     ORDER BY percentage DESC`,
    [app.applicant_user_id]
  );

  // Match qualifying record
  const matchingEdu = eduRecords.find(
    (e) => e.qualification.toUpperCase() === rule.qualification.toUpperCase()
  ) || eduRecords[0];

  const actualPercentage = matchingEdu ? Number(matchingEdu.percentage) : 0;
  const minRequired = Number(rule.minimum_percentage);
  const isEligible = actualPercentage >= minRequired;
  const eligibilityStatus = isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE";

  // Insert or update eligibility_evaluations
  const [evalResult] = await executor.execute(
    `INSERT INTO eligibility_evaluations (application_id, rule_id, evaluated_by, eligibility_status, total_percentage, remarks, evaluated_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      applicationId,
      rule.rule_id,
      evaluatedBy,
      eligibilityStatus,
      actualPercentage,
      `Calculated percentage ${actualPercentage}% against minimum required ${minRequired}% for ${rule.qualification}`,
    ]
  );

  const evaluationId = evalResult.insertId;

  // Insert checks into eligibility_evaluation_checks
  await executor.execute(
    `INSERT INTO eligibility_evaluation_checks (evaluation_id, check_name, expected_value, actual_value, check_status, remarks)
     VALUES (?, 'Minimum Aggregate Percentage', ?, ?, ?, ?)`,
    [
      evaluationId,
      `${minRequired}%`,
      `${actualPercentage}%`,
      isEligible ? "PASS" : "FAIL",
      isEligible
        ? "Academic qualification criteria met."
        : "Academic aggregate marks below minimum required cutoff.",
    ]
  );

  // Record stage history
  await executor.execute(
    `INSERT INTO application_stage_history (application_id, stage_id, stage_status, changed_by, remarks, changed_at)
     VALUES (?, 3, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      applicationId,
      isEligible ? "PASS" : "FAIL",
      evaluatedBy,
      `Eligibility screening completed: ${eligibilityStatus} (${actualPercentage}% vs ${minRequired}%)`,
    ]
  );

  // Update application status
  if (isEligible) {
    await executor.execute(
      `UPDATE applications 
       SET current_stage_id = 4, application_status = 'UNDER_REVIEW', updated_at = CURRENT_TIMESTAMP
       WHERE application_id = ?`,
      [applicationId]
    );

    await createNotification({
      userId: app.applicant_user_id,
      title: "Eligibility Screening Passed",
      message: `Congratulations! Your application ${applicationId} for ${app.programme_name} has passed academic eligibility screening.`,
      notificationType: "APPLICATION_STAGE",
      connection: executor,
    });
  } else {
    await executor.execute(
      `UPDATE applications 
       SET application_status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
       WHERE application_id = ?`,
      [applicationId]
    );

    await createNotification({
      userId: app.applicant_user_id,
      title: "Eligibility Screening Update",
      message: `Your application ${applicationId} for ${app.programme_name} did not meet the minimum eligibility requirement of ${minRequired}%.`,
      notificationType: "APPLICATION_STAGE",
      connection: executor,
    });
  }

  return {
    evaluationId,
    eligibilityStatus,
    actualPercentage,
    minRequired,
    isEligible,
  };
}
