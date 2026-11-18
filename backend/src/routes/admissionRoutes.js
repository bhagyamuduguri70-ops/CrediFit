import { Router } from "express";
import {
  recordFinalDecision,
  getFinalDecision,
  getMeritList,
} from "../controllers/admissionController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isOfficerOrAdmin, isStaffOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Stage 5 & Merit Screening
router.get("/merit-list", isStaffOrAdmin, getMeritList);
router.get("/:applicationId", getFinalDecision);
router.post("/:applicationId/decision", isOfficerOrAdmin, recordFinalDecision);

export default router;
