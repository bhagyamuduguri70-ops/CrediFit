import { sendError } from "../utils/responseHandler.js";

export function requireRole(allowedRoles = []) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }

    if (!rolesArray.includes(req.user.role_code)) {
      return sendError(
        res,
        `Access denied. Role '${req.user.role_code}' is not authorized for this resource.`,
        403
      );
    }

    next();
  };
}

export const isApplicant = requireRole(["APPLICANT"]);
export const isAdmissionOfficer = requireRole(["ADMISSION_OFFICER"]);
export const isEvaluator = requireRole(["EVALUATOR"]);
export const isAdmin = requireRole(["ADMIN"]);
export const isStaffOrAdmin = requireRole(["ADMISSION_OFFICER", "EVALUATOR", "ADMIN"]);
export const isOfficerOrAdmin = requireRole(["ADMISSION_OFFICER", "ADMIN"]);
