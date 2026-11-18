import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";

export async function getAllProgrammes(req, res, next) {
  try {
    const isStaff = req.user && req.user.role_code !== "APPLICANT";
    let query = `
      SELECT p.programme_id, p.programme_code, p.programme_name, p.description,
             p.duration_years, p.qualification_required, p.programme_status, p.created_at,
             COUNT(pdr.requirement_id) AS required_documents_count
      FROM programmes p
      LEFT JOIN programme_document_requirements pdr ON p.programme_id = pdr.programme_id
    `;

    if (!isStaff) {
      query += ` WHERE p.programme_status = 'ACTIVE' `;
    }

    query += ` GROUP BY p.programme_id ORDER BY p.programme_name ASC`;

    const [rows] = await pool.query(query);
    return sendSuccess(res, "Programmes retrieved successfully.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function getProgrammeById(req, res, next) {
  try {
    const programmeId = Number(req.params.id);

    const [progRows] = await pool.execute(
      `SELECT programme_id, programme_code, programme_name, description,
              duration_years, qualification_required, programme_status, created_at
       FROM programmes
       WHERE programme_id = ?
       LIMIT 1`,
      [programmeId]
    );

    const programme = progRows[0];
    if (!programme) {
      return sendError(res, "Programme not found.", 404);
    }

    // Get required documents
    const [docReqs] = await pool.execute(
      `SELECT pdr.requirement_id, pdr.is_mandatory, dt.document_type_id, dt.document_code, dt.document_name, dt.description
       FROM programme_document_requirements pdr
       JOIN document_types dt ON pdr.document_type_id = dt.document_type_id
       WHERE pdr.programme_id = ?`,
      [programmeId]
    );

    // Get eligibility rules
    const [rules] = await pool.execute(
      `SELECT rule_id, qualification, minimum_percentage, rule_description, is_active
       FROM eligibility_rules
       WHERE programme_id = ?`,
      [programmeId]
    );

    return sendSuccess(res, "Programme details retrieved.", {
      ...programme,
      requiredDocuments: docReqs,
      eligibilityRules: rules,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createProgramme(req, res, next) {
  try {
    const {
      programmeCode,
      programmeName,
      description,
      durationYears = 3,
      qualificationRequired = "12TH",
      programmeStatus = "ACTIVE",
    } = req.body;

    if (!programmeCode || !programmeName) {
      return sendError(res, "Programme code and name are required.", 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO programmes (programme_code, programme_name, description, duration_years, qualification_required, programme_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        programmeCode.trim().toUpperCase(),
        programmeName.trim(),
        description || null,
        Number(durationYears),
        qualificationRequired.trim(),
        programmeStatus,
      ]
    );

    const programmeId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: "CREATE_PROGRAMME",
      entityName: "programmes",
      entityId: programmeId,
      newValues: { programmeCode, programmeName },
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Programme created successfully.", { programmeId }, 201);
  } catch (error) {
    return next(error);
  }
}

export async function updateProgramme(req, res, next) {
  try {
    const programmeId = Number(req.params.id);
    const {
      programmeCode,
      programmeName,
      description,
      durationYears,
      qualificationRequired,
      programmeStatus,
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE programmes
       SET programme_code = COALESCE(?, programme_code),
           programme_name = COALESCE(?, programme_name),
           description = COALESCE(?, description),
           duration_years = COALESCE(?, duration_years),
           qualification_required = COALESCE(?, qualification_required),
           programme_status = COALESCE(?, programme_status)
       WHERE programme_id = ?`,
      [
        programmeCode ? programmeCode.trim().toUpperCase() : null,
        programmeName ? programmeName.trim() : null,
        description !== undefined ? description : null,
        durationYears ? Number(durationYears) : null,
        qualificationRequired ? qualificationRequired.trim() : null,
        programmeStatus || null,
        programmeId,
      ]
    );

    if (result.affectedRows === 0) {
      return sendError(res, "Programme not found.", 404);
    }

    await logAudit({
      userId: req.user.user_id,
      action: "UPDATE_PROGRAMME",
      entityName: "programmes",
      entityId: programmeId,
      newValues: req.body,
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Programme updated successfully.");
  } catch (error) {
    return next(error);
  }
}

export async function getAllCycles(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT cycle_id, cycle_name, academic_year, start_date, end_date, cycle_status, created_at
       FROM admission_cycles
       ORDER BY start_date DESC`
    );
    return sendSuccess(res, "Admission cycles retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function createCycle(req, res, next) {
  try {
    const { cycleName, academicYear, startDate, endDate, cycleStatus = "ACTIVE" } = req.body;

    if (!cycleName || !academicYear || !startDate || !endDate) {
      return sendError(res, "Cycle name, academic year, start date, and end date are required.", 400);
    }

    const [result] = await pool.execute(
      `INSERT INTO admission_cycles (cycle_name, academic_year, start_date, end_date, cycle_status, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [cycleName.trim(), academicYear.trim(), startDate, endDate, cycleStatus]
    );

    const cycleId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: "CREATE_ADMISSION_CYCLE",
      entityName: "admission_cycles",
      entityId: cycleId,
      newValues: req.body,
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Admission cycle created successfully.", { cycleId }, 201);
  } catch (error) {
    return next(error);
  }
}
