import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getEducationRecords,
  addEducationRecord,
  deleteEducationRecord,
  listApplicants,
} from "../controllers/applicantController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isStaffOrAdmin, isApplicant } from "../middleware/roleMiddleware.js";

const router = Router();

// Profile management
router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, isApplicant, updateProfile);

// Education records
router.get("/education", authenticateToken, getEducationRecords);
router.post("/education", authenticateToken, isApplicant, addEducationRecord);
router.delete("/education/:id", authenticateToken, isApplicant, deleteEducationRecord);

// Staff access
router.get("/", authenticateToken, isStaffOrAdmin, listApplicants);
router.get("/:id", authenticateToken, isStaffOrAdmin, getProfile);

export default router;
