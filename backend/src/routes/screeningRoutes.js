import { Router } from "express";
import {
  runEligibilityCheck,
  getEligibility,
  assignEvaluator,
  getEvaluatorAssignments,
  getProgrammeRubrics,
  submitDepartmentReview,
} from "../controllers/screeningController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isOfficerOrAdmin, isEvaluator, isStaffOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Stage 3: Eligibility
router.post("/eligibility/:applicationId", isOfficerOrAdmin, runEligibilityCheck);
router.get("/eligibility/:applicationId", isStaffOrAdmin, getEligibility);

// Stage 4: Department Evaluation
router.post("/assign-evaluator", isOfficerOrAdmin, assignEvaluator);
router.get("/evaluator/assignments", isEvaluator, getEvaluatorAssignments);
router.get("/rubrics/programme/:programmeId", getProgrammeRubrics);
router.post("/department-review/:applicationId", isEvaluator, submitDepartmentReview);

export default router;
