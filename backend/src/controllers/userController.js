import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";

export async function listUsers(req, res, next) {
  try {
    const { roleCode, status, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone_country_code, u.phone,
             u.account_status, u.email_verified, u.created_at,
             r.role_code, r.role_name,
             sp.department, sp.designation
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      LEFT JOIN staff_profiles sp ON u.user_id = sp.user_id
      WHERE 1=1
    `;

    const params = [];
    if (roleCode) {
      query += ` AND r.role_code = ? `;
      params.push(roleCode);
    }
    if (status) {
      query += ` AND u.account_status = ? `;
      params.push(status);
    }
    if (search && search.trim()) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?) `;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ? `;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "Users retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function createUser(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      fullName,
      email,
      password,
      roleCode,
      phoneCountryCode = "+91",
      phone,
      department = "Admissions",
      designation = "Staff",
    } = req.body;

    if (!fullName || !email || !password || !roleCode) {
      return sendError(res, "Full name, email, password, and roleCode are required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connection.beginTransaction();

    const [existing] = await connection.execute(
      "SELECT user_id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing[0]) {
      return sendError(res, "An account with this email already exists.", 409);
    }

    const [roles] = await connection.execute(
      "SELECT role_id, role_code FROM roles WHERE role_code = ? LIMIT 1",
      [roleCode]
    );

    if (!roles[0]) {
      return sendError(res, `Invalid role: ${roleCode}`, 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      `INSERT INTO users (role_id, full_name, email, password_hash, phone_country_code, phone, account_status, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, CURRENT_TIMESTAMP)`,
      [roles[0].role_id, fullName.trim(), normalizedEmail, passwordHash, phoneCountryCode, phone || null]
    );

    const userId = result.insertId;

    if (roleCode !== "APPLICANT") {
      await connection.execute(
        `INSERT INTO staff_profiles (user_id, employee_code, department, designation, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, `EMP-${userId}`, department, designation]
      );
    }

    await logAudit({
      userId: req.user.user_id,
      action: "ADMIN_CREATE_USER",
      entityName: "users",
      entityId: userId,
      newValues: { email: normalizedEmail, roleCode },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(res, `User account created successfully for role ${roleCode}.`, { userId }, 201);
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      return sendError(res, "Status must be one of: ACTIVE, INACTIVE, SUSPENDED.", 400);
    }

    const [result] = await pool.execute(
      `UPDATE users SET account_status = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return sendError(res, "User not found.", 404);
    }

    await logAudit({
      userId: req.user.user_id,
      action: "UPDATE_USER_STATUS",
      entityName: "users",
      entityId: userId,
      newValues: { status },
      ipAddress: req.ip,
    });

    return sendSuccess(res, `User status updated to ${status}.`);
  } catch (error) {
    return next(error);
  }
}

export async function getAuditLogs(req, res, next) {
  try {
    const { limit = 100, offset = 0, action = "" } = req.query;

    let query = `
      SELECT al.audit_id, al.user_id, al.action, al.entity_name, al.entity_id,
             al.old_values, al.new_values, al.ip_address, al.created_at,
             u.full_name AS user_name, u.email AS user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    if (action.trim()) {
      query += ` AND al.action LIKE ? `;
      params.push(`%${action.trim()}%`);
    }

    query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ? `;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "Audit logs retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function getRoles(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT role_id, role_code, role_name, description FROM roles ORDER BY role_id ASC"
    );
    return sendSuccess(res, "Roles retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}
