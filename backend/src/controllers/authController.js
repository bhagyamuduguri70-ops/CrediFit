import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshCookieOptions,
} from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";

export async function register(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      fullName,
      email,
      password,
      phoneCountryCode = "+91",
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      nationality = "Indian",
    } = req.body;

    if (!fullName || !email || !password) {
      return sendError(res, "Full name, email, and password are required.", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const [existing] = await connection.execute(
      "SELECT user_id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return sendError(res, "An account with this email address already exists.", 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    await connection.beginTransaction();

    // Role 1 is APPLICANT in roles table
    const [roleRows] = await connection.execute(
      "SELECT role_id FROM roles WHERE role_code = 'APPLICANT' LIMIT 1"
    );
    const applicantRoleId = roleRows[0]?.role_id || 1;

    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (role_id, full_name, email, password_hash, phone_country_code, phone, account_status, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 0, CURRENT_TIMESTAMP)`,
      [
        applicantRoleId,
        fullName.trim(),
        normalizedEmail,
        passwordHash,
        phoneCountryCode,
        phone || null,
      ]
    );

    const userId = userResult.insertId;

    // Insert applicant profile
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

    // Create session tokens
    const userPayload = {
      user_id: userId,
      role_id: applicantRoleId,
      role_code: "APPLICANT",
      full_name: fullName.trim(),
      email: normalizedEmail,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await connection.execute(
      `INSERT INTO refresh_sessions (user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, tokenHash, expiresAt]
    );

    await logAudit({
      userId,
      action: "USER_REGISTER",
      entityName: "users",
      entityId: userId,
      newValues: { email: normalizedEmail, fullName: fullName.trim() },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    res.cookie(env.COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    return sendSuccess(
      res,
      "Registration successful.",
      {
        accessToken,
        user: {
          userId,
          fullName: fullName.trim(),
          email: normalizedEmail,
          roleCode: "APPLICANT",
          roleName: "Applicant",
        },
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

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.execute(
      `SELECT u.user_id, u.role_id, u.full_name, u.email, u.password_hash, 
              u.account_status, u.phone_country_code, u.phone, r.role_code, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = rows[0];
    if (!user) {
      return sendError(res, "Invalid email or password.", 401);
    }

    if (user.account_status !== "ACTIVE") {
      return sendError(res, `Account is ${user.account_status.toLowerCase()}. Please contact administrator.`, 403);
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, "Invalid email or password.", 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    // Save refresh session
    await pool.execute(
      `INSERT INTO refresh_sessions (user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [user.user_id, tokenHash, expiresAt]
    );

    await logAudit({
      userId: user.user_id,
      action: "USER_LOGIN",
      entityName: "users",
      entityId: user.user_id,
      ipAddress: req.ip,
    });

    res.cookie(env.COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    return sendSuccess(res, "Login successful.", {
      accessToken,
      user: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        roleCode: user.role_code,
        roleName: user.role_name,
        phone: user.phone,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const rawRefreshToken = req.cookies[env.COOKIE_NAME] || req.body.refreshToken;

    if (!rawRefreshToken) {
      return sendError(res, "No refresh token provided.", 401);
    }

    const tokenHash = hashToken(rawRefreshToken);

    const [rows] = await pool.execute(
      `SELECT s.session_id, s.user_id, s.expires_at, s.revoked_at,
              u.role_id, u.full_name, u.email, u.account_status, r.role_code, r.role_name
       FROM refresh_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN roles r ON u.role_id = r.role_id
       WHERE s.token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );

    const session = rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at) < new Date()) {
      return sendError(res, "Refresh token is invalid or expired.", 401);
    }

    if (session.account_status !== "ACTIVE") {
      return sendError(res, "User account is inactive.", 403);
    }

    // Revoke old session and issue new token pair (rotation)
    await pool.execute(
      `UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE session_id = ?`,
      [session.session_id]
    );

    const newRefreshToken = generateRefreshToken();
    const newHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

    await pool.execute(
      `INSERT INTO refresh_sessions (user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
      [session.user_id, newHash, newExpiresAt]
    );

    const accessToken = generateAccessToken({
      user_id: session.user_id,
      role_id: session.role_id,
      role_code: session.role_code,
      full_name: session.full_name,
      email: session.email,
    });

    res.cookie(env.COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

    return sendSuccess(res, "Token refreshed successfully.", {
      accessToken,
      user: {
        userId: session.user_id,
        fullName: session.full_name,
        email: session.email,
        roleCode: session.role_code,
        roleName: session.role_name,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies[env.COOKIE_NAME] || req.body.refreshToken;
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await pool.execute(
        `UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?`,
        [tokenHash]
      );
    }

    if (req.user) {
      await logAudit({
        userId: req.user.user_id,
        action: "USER_LOGOUT",
        entityName: "users",
        entityId: req.user.user_id,
        ipAddress: req.ip,
      });
    }

    res.clearCookie(env.COOKIE_NAME, { path: "/" });
    return sendSuccess(res, "Logged out successfully.");
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const [userRows] = await pool.execute(
      `SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone_country_code, u.phone,
              u.account_status, u.email_verified, u.created_at, r.role_code, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [req.user.user_id]
    );

    const user = userRows[0];
    if (!user) {
      return sendError(res, "User not found.", 404);
    }

    let profile = null;
    if (user.role_code === "APPLICANT") {
      const [pRows] = await pool.execute(
        `SELECT applicant_profile_id, date_of_birth, gender, address, city, state, pincode, nationality
         FROM applicant_profiles
         WHERE user_id = ?
         LIMIT 1`,
        [user.user_id]
      );
      profile = pRows[0] || null;
    } else {
      const [sRows] = await pool.execute(
        `SELECT staff_profile_id, employee_code, department, designation
         FROM staff_profiles
         WHERE user_id = ?
         LIMIT 1`,
        [user.user_id]
      );
      profile = sRows[0] || null;
    }

    return sendSuccess(res, "Profile retrieved successfully.", {
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      phoneCountryCode: user.phone_country_code,
      phone: user.phone,
      roleCode: user.role_code,
      roleName: user.role_name,
      emailVerified: Boolean(user.email_verified),
      profile,
    });
  } catch (error) {
    return next(error);
  }
}
