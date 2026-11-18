import { Router } from "express";
import {
  getAdminDashboardStats,
  getOfficerDashboardStats,
  getEvaluatorDashboardStats,
  getApplicantDashboardStats,
  getAdmissionReports,
} from "../controllers/dashboardController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin, isAdmissionOfficer, isEvaluator, isApplicant, isStaffOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/admin", isAdmin, getAdminDashboardStats);
router.get("/reports", isStaffOrAdmin, getAdmissionReports);
router.get("/officer", isAdmissionOfficer, getOfficerDashboardStats);
router.get("/evaluator", isEvaluator, getEvaluatorDashboardStats);
router.get("/applicant", isApplicant, getApplicantDashboardStats);

export default router;
