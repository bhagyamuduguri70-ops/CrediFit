import { Router } from "express";
import {
  createClarification,
  respondClarification,
  getClarificationsByApplication,
} from "../controllers/clarificationController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isStaffOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

router.get("/application/:applicationId", getClarificationsByApplication);
router.post("/", isStaffOrAdmin, createClarification);
router.post("/:id/respond", respondClarification);

export default router;
