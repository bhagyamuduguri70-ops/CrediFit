import { pool } from "../config/db.js";
import { sendSuccess } from "../utils/responseHandler.js";

export async function getAdminDashboardStats(req, res, next) {
  try {
    // Basic counts
    const [userCounts] = await pool.query(
      `SELECT r.role_code, COUNT(u.user_id) AS total
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       GROUP BY r.role_code`
    );

    const [appCounts] = await pool.query(
      `SELECT application_status, COUNT(application_id) AS total
       FROM applications
       GROUP BY application_status`
    );

    const [stageCounts] = await pool.query(
      `SELECT s.stage_name, s.stage_order, COUNT(a.application_id) AS total
       FROM application_stages s
       LEFT JOIN applications a ON s.stage_id = a.current_stage_id
       GROUP BY s.stage_id, s.stage_name, s.stage_order
       ORDER BY s.stage_order ASC`
    );

    const [progCounts] = await pool.query(
      `SELECT p.programme_name, p.programme_code, COUNT(a.application_id) AS applications_count
       FROM programmes p
       LEFT JOIN applications a ON p.programme_id = a.programme_id
       GROUP BY p.programme_id, p.programme_name, p.programme_code`
    );

    const [recentApplications] = await pool.query(
      `SELECT a.application_id, a.application_reference, a.application_status, a.created_at,
              u.full_name AS applicant_name, p.programme_code
       FROM applications a
       JOIN users u ON a.applicant_user_id = u.user_id
       JOIN programmes p ON a.programme_id = p.programme_id
       ORDER BY a.created_at DESC
       LIMIT 8`
    );

    const [recentAuditLogs] = await pool.query(
      `SELECT al.audit_id, al.action, al.entity_name, al.entity_id, al.created_at,
              u.full_name AS user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.user_id
       ORDER BY al.created_at DESC
       LIMIT 10`
    );

    const usersByRole = userCounts.reduce((acc, curr) => {
      acc[curr.role_code] = Number(curr.total);
      return acc;
    }, {});

    const applicationsByStatus = appCounts.reduce((acc, curr) => {
      acc[curr.application_status] = Number(curr.total);
      return acc;
    }, {});

    const totalApplications = Object.values(applicationsByStatus).reduce((a, b) => a + b, 0);

    return sendSuccess(res, "Admin dashboard statistics retrieved.", {
      usersByRole,
      applicationsByStatus,
      totalApplications,
      totalApplicants: usersByRole.APPLICANT || 0,
      admittedCount: applicationsByStatus.ADMITTED || 0,
      rejectedCount: applicationsByStatus.REJECTED || 0,
      pendingCount: (applicationsByStatus.SUBMITTED || 0) + (applicationsByStatus.UNDER_REVIEW || 0),
      stageDistribution: stageCounts,
      programmeDistribution: progCounts,
      recentApplications,
      recentAuditLogs,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getOfficerDashboardStats(req, res, next) {
  try {
    const [pendingDocs] = await pool.query(
      `SELECT COUNT(document_id) AS count FROM application_documents WHERE upload_status = 'UPLOADED'`
    );

    const [stage2Apps] = await pool.query(
      `SELECT COUNT(application_id) AS count FROM applications WHERE current_stage_id = 2`
    );

    const [stage3Apps] = await pool.query(
      `SELECT COUNT(application_id) AS count FROM applications WHERE current_stage_id = 3`
    );

    const [recentSubmissions] = await pool.query(
      `SELECT a.application_id, a.application_reference, a.application_status, a.current_stage_id, a.submitted_at,
              u.full_name AS applicant_name, p.programme_code
       FROM applications a
       JOIN users u ON a.applicant_user_id = u.user_id
       JOIN programmes p ON a.programme_id = p.programme_id
       WHERE a.application_status != 'DRAFT'
       ORDER BY a.submitted_at DESC
       LIMIT 10`
    );

    return sendSuccess(res, "Officer dashboard statistics retrieved.", {
      pendingDocumentsCount: pendingDocs[0]?.count || 0,
      pendingDocumentVerificationApps: stage2Apps[0]?.count || 0,
      pendingEligibilityScreeningApps: stage3Apps[0]?.count || 0,
      recentSubmissions,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getEvaluatorDashboardStats(req, res, next) {
  try {
    const evaluatorId = req.user.user_id;

    const [assigned] = await pool.execute(
      `SELECT COUNT(assignment_id) AS count FROM evaluator_assignments WHERE evaluator_user_id = ? AND assignment_status = 'ACTIVE'`,
      [evaluatorId]
    );

    const [completed] = await pool.execute(
      `SELECT COUNT(assignment_id) AS count FROM evaluator_assignments WHERE evaluator_user_id = ? AND assignment_status = 'COMPLETED'`,
      [evaluatorId]
    );

    const [recentAssignments] = await pool.execute(
      `SELECT ea.assignment_id, ea.application_id, ea.assignment_status, ea.assigned_at,
              a.application_reference, p.programme_code, u.full_name AS applicant_name
       FROM evaluator_assignments ea
       JOIN applications a ON ea.application_id = a.application_id
       JOIN programmes p ON a.programme_id = p.programme_id
       JOIN users u ON a.applicant_user_id = u.user_id
       WHERE ea.evaluator_user_id = ?
       ORDER BY ea.assigned_at DESC LIMIT 5`,
      [evaluatorId]
    );

    return sendSuccess(res, "Evaluator dashboard statistics retrieved.", {
      pendingAssignments: assigned[0]?.count || 0,
      completedAssignments: completed[0]?.count || 0,
      recentAssignments,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getApplicantDashboardStats(req, res, next) {
  try {
    const userId = req.user.user_id;

    const [applications] = await pool.execute(
      `SELECT a.application_id, a.application_reference, a.application_status, a.current_stage_id,
              p.programme_name, p.programme_code,
              s.stage_name, s.stage_order,
              fd.decision AS final_decision
       FROM applications a
       JOIN programmes p ON a.programme_id = p.programme_id
       JOIN application_stages s ON a.current_stage_id = s.stage_id
       LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
       WHERE a.applicant_user_id = ?
       ORDER BY a.created_at DESC`,
      [userId]
    );

    const [unreadNotifs] = await pool.execute(
      `SELECT COUNT(notification_id) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    const [eduRecords] = await pool.execute(
      `SELECT COUNT(education_record_id) AS count FROM education_records WHERE user_id = ?`,
      [userId]
    );

    return sendSuccess(res, "Applicant dashboard data retrieved.", {
      applications,
      totalApplications: applications.length,
      unreadNotificationsCount: unreadNotifs[0]?.count || 0,
      educationRecordsCount: eduRecords[0]?.count || 0,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getAdmissionReports(req, res, next) {
  try {
    // 1. Overall pipeline KPIs
    const [summaryCounts] = await pool.query(
      `SELECT 
        COUNT(a.application_id) AS total_applications,
        COUNT(DISTINCT a.applicant_user_id) AS total_applicants,
        SUM(CASE WHEN a.current_stage_id = 5 OR fd.decision IS NOT NULL THEN 1 ELSE 0 END) AS evaluated_count,
        SUM(CASE WHEN fd.decision = 'ADMITTED' THEN 1 ELSE 0 END) AS admitted_count,
        SUM(CASE WHEN fd.decision = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_count,
        SUM(CASE WHEN fd.decision = 'WAITLISTED' THEN 1 ELSE 0 END) AS waitlisted_count,
        SUM(CASE WHEN a.application_status IN ('SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) AS in_progress_count
       FROM applications a
       LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
       WHERE a.application_status != 'DRAFT'`
    );

    // 2. Programme performance
    const [programmeStats] = await pool.query(
      `SELECT 
        p.programme_id,
        p.programme_code,
        p.programme_name,
        COUNT(a.application_id) AS applications_count,
        SUM(CASE WHEN fd.decision = 'ADMITTED' THEN 1 ELSE 0 END) AS admitted_count,
        ROUND(AVG(COALESCE(er.percentage, 0)), 1) AS avg_percentage
       FROM programmes p
       LEFT JOIN applications a ON p.programme_id = a.programme_id AND a.application_status != 'DRAFT'
       LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
       LEFT JOIN (
         SELECT user_id, MAX(percentage) AS percentage
         FROM education_records
         GROUP BY user_id
       ) er ON a.applicant_user_id = er.user_id
       GROUP BY p.programme_id, p.programme_code, p.programme_name`
    );

    // 3. Stage-wise funnel breakdown
    const [stageFunnel] = await pool.query(
      `SELECT 
        s.stage_id,
        s.stage_order,
        s.stage_name,
        COUNT(a.application_id) AS active_candidates,
        SUM(CASE WHEN a.current_stage_id >= s.stage_id THEN 1 ELSE 0 END) AS reached_or_passed
       FROM application_stages s
       LEFT JOIN applications a ON s.stage_id = a.current_stage_id AND a.application_status != 'DRAFT'
       GROUP BY s.stage_id, s.stage_order, s.stage_name
       ORDER BY s.stage_order ASC`
    );

    // 4. Document verification health
    const [docStats] = await pool.query(
      `SELECT 
        COUNT(document_id) AS total_documents,
        SUM(CASE WHEN verification_status = 'VERIFIED' THEN 1 ELSE 0 END) AS verified_docs,
        SUM(CASE WHEN verification_status = 'REJECTED' THEN 1 ELSE 0 END) AS rejected_docs,
        SUM(CASE WHEN verification_status = 'PENDING' OR upload_status = 'UPLOADED' THEN 1 ELSE 0 END) AS pending_docs
       FROM application_documents`
    );

    // 5. Category-wise reservation breakdown
    const [categoryStats] = await pool.query(
      `SELECT 
        COALESCE(ap.category, 'GENERAL') AS category,
        COUNT(a.application_id) AS total_applications,
        SUM(CASE WHEN fd.decision = 'ADMITTED' THEN 1 ELSE 0 END) AS admitted_count
       FROM applications a
       JOIN users u ON a.applicant_user_id = u.user_id
       LEFT JOIN applicant_profiles ap ON u.user_id = ap.user_id
       LEFT JOIN final_decisions fd ON a.application_id = fd.application_id
       WHERE a.application_status != 'DRAFT'
       GROUP BY COALESCE(ap.category, 'GENERAL')`
    );

    return sendSuccess(res, "Admission analytics reports retrieved.", {
      summary: summaryCounts[0] || {},
      programmes: programmeStats,
      funnel: stageFunnel,
      documents: docStats[0] || {},
      categories: categoryStats,
    });
  } catch (error) {
    return next(error);
  }
}
