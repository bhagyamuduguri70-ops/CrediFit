import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../config/db.js";
import { sendError } from "../utils/responseHandler.js";

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies[env.COOKIE_NAME]) {
      // In case access token or fallback
    }

    if (!token) {
      return sendError(res, "Authentication required. Please provide a valid Bearer token.", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, "Token has expired. Please refresh your session.", 401);
      }
      return sendError(res, "Invalid authentication token.", 401);
    }

    const [rows] = await pool.execute(
      `SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone_country_code, u.phone, 
              u.account_status, u.email_verified, r.role_code, r.role_name
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?
       LIMIT 1`,
      [decoded.userId || decoded.sub]
    );

    const user = rows[0];
    if (!user) {
      return sendError(res, "User account not found.", 401);
    }

    if (user.account_status !== "ACTIVE") {
      return sendError(res, `Account is ${user.account_status.toLowerCase()}. Access denied.`, 403);
    }

    req.user = {
      user_id: user.user_id,
      role_id: user.role_id,
      full_name: user.full_name,
      email: user.email,
      phone_country_code: user.phone_country_code,
      phone: user.phone,
      account_status: user.account_status,
      email_verified: Boolean(user.email_verified),
      role_code: user.role_code,
      role_name: user.role_name,
    };

    next();
  } catch (error) {
    return next(error);
  }
}
