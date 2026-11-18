import { Router } from "express";
import {
  createApplication,
  submitApplication,
  getMyApplications,
  getAllApplications,
  getApplicationById,
} from "../controllers/applicationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isApplicant, isStaffOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Applicant endpoints
router.post("/", isApplicant, createApplication);
router.post("/:id/submit", submitApplication);
router.get("/my", isApplicant, getMyApplications);

// Shared / Staff endpoints
router.get("/", isStaffOrAdmin, getAllApplications);
router.get("/:id", getApplicationById);

export default router;
