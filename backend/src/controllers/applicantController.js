import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";

export async function getProfile(req, res, next) {
  try {
    const userId = req.params.id ? Number(req.params.id) : req.user.user_id;

    // Applicants can only view their own profile
    if (req.user.role_code === "APPLICANT" && userId !== req.user.user_id) {
      return sendError(res, "Access denied.", 403);
    }

    const [uRows] = await pool.execute(
      `SELECT user_id, full_name, email, phone_country_code, phone, account_status
       FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    if (!uRows[0]) {
      return sendError(res, "Applicant not found.", 404);
    }

    const [pRows] = await pool.execute(
      `SELECT applicant_profile_id, date_of_birth, gender, address, city, state, pincode, nationality, created_at
       FROM applicant_profiles WHERE user_id = ? LIMIT 1`,
      [userId]
    );

    const [eduRows] = await pool.execute(
      `SELECT education_record_id, qualification, institution, board, year_of_passing, marks_obtained, maximum_marks, percentage
       FROM education_records WHERE user_id = ? ORDER BY year_of_passing DESC`,
      [userId]
    );

    return sendSuccess(res, "Applicant profile retrieved.", {
      user: uRows[0],
      profile: pRows[0] || null,
      educationRecords: eduRows,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateProfile(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const {
      fullName,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      nationality,
    } = req.body;

    await connection.beginTransaction();

    if (fullName || phone) {
      await connection.execute(
        `UPDATE users 
         SET full_name = COALESCE(?, full_name),
             phone = COALESCE(?, phone),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [fullName || null, phone || null, userId]
      );
    }

    const [existing] = await connection.execute(
      "SELECT applicant_profile_id FROM applicant_profiles WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      await connection.execute(
        `UPDATE applicant_profiles
         SET date_of_birth = COALESCE(?, date_of_birth),
             gender = COALESCE(?, gender),
             address = COALESCE(?, address),
             city = COALESCE(?, city),
             state = COALESCE(?, state),
             pincode = COALESCE(?, pincode),
             nationality = COALESCE(?, nationality)
         WHERE user_id = ?`,
        [
          dateOfBirth || null,
          gender || null,
          address || null,
          city || null,
          state || null,
          pincode || null,
          nationality || null,
          userId,
        ]
      );
    } else {
      await connection.execute(
        `INSERT INTO applicant_profiles (user_id, date_of_birth, gender, address, city, state, pincode, nationality, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          userId,
          dateOfBirth || null,
          gender || null,
          address || null,
          city || null,
          state || null,
          pincode || null,
          nationality || "Indian",
        ]
      );
    }

    await logAudit({
      userId,
      action: "UPDATE_PROFILE",
      entityName: "applicant_profiles",
      entityId: userId,
      newValues: { fullName, phone, city, state },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();
    return sendSuccess(res, "Profile updated successfully.");
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getEducationRecords(req, res, next) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.execute(
      `SELECT education_record_id, qualification, institution, board, year_of_passing, marks_obtained, maximum_marks, percentage, created_at
       FROM education_records
       WHERE user_id = ?
       ORDER BY year_of_passing DESC`,
      [userId]
    );

    return sendSuccess(res, "Education records retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function addEducationRecord(req, res, next) {
  try {
    const userId = req.user.user_id;
    const {
      qualification,
      institution,
      board,
      yearOfPassing,
      marksObtained,
      maximumMarks,
    } = req.body;

    if (!qualification || !institution || !board || !yearOfPassing || marksObtained === undefined || maximumMarks === undefined) {
      return sendError(res, "All academic fields are required.", 400);
    }

    const marks = Number(marksObtained);
    const maxMarks = Number(maximumMarks);

    if (maxMarks <= 0 || marks < 0 || marks > maxMarks) {
      return sendError(res, "Marks obtained must be between 0 and maximum marks, and maximum marks must be greater than 0.", 400);
    }

    // Insert into education_records (percentage is generated stored column)
    const [result] = await pool.execute(
      `INSERT INTO education_records (user_id, qualification, institution, board, year_of_passing, marks_obtained, maximum_marks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, qualification.trim(), institution.trim(), board.trim(), Number(yearOfPassing), marks, maxMarks]
    );

    const recordId = result.insertId;

    const [record] = await pool.execute(
      `SELECT education_record_id, qualification, institution, board, year_of_passing, marks_obtained, maximum_marks, percentage
       FROM education_records WHERE education_record_id = ?`,
      [recordId]
    );

    await logAudit({
      userId,
      action: "ADD_EDUCATION_RECORD",
      entityName: "education_records",
      entityId: recordId,
      newValues: { qualification, marksObtained: marks, maximumMarks: maxMarks },
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Education record added successfully.", record[0], 201);
  } catch (error) {
    return next(error);
  }
}

export async function deleteEducationRecord(req, res, next) {
  try {
    const userId = req.user.user_id;
    const recordId = Number(req.params.id);

    const [result] = await pool.execute(
      `DELETE FROM education_records WHERE education_record_id = ? AND user_id = ?`,
      [recordId, userId]
    );

    if (result.affectedRows === 0) {
      return sendError(res, "Education record not found or not authorized to delete.", 404);
    }

    await logAudit({
      userId,
      action: "DELETE_EDUCATION_RECORD",
      entityName: "education_records",
      entityId: recordId,
      ipAddress: req.ip,
    });

    return sendSuccess(res, "Education record deleted.");
  } catch (error) {
    return next(error);
  }
}

export async function listApplicants(req, res, next) {
  try {
    const { search = "", limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT u.user_id, u.full_name, u.email, u.phone, u.account_status, u.created_at,
             ap.city, ap.state, ap.gender,
             COUNT(a.application_id) AS total_applications
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN applicant_profiles ap ON u.user_id = ap.user_id
      LEFT JOIN applications a ON u.user_id = a.applicant_user_id
      WHERE r.role_code = 'APPLICANT'
    `;

    const params = [];
    if (search.trim()) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?) `;
      const searchWildcard = `%${search.trim()}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    query += ` GROUP BY u.user_id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "Applicants list retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}
