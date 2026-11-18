import { Router } from "express";
import {
  getAllProgrammes,
  getProgrammeById,
  createProgramme,
  updateProgramme,
  getAllCycles,
  createCycle,
} from "../controllers/courseController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

// Public / Authenticated views
router.get("/programmes", getAllProgrammes);
router.get("/programmes/:id", getProgrammeById);
router.get("/cycles", getAllCycles);

// Admin management
router.post("/programmes", authenticateToken, isAdmin, createProgramme);
router.put("/programmes/:id", authenticateToken, isAdmin, updateProgramme);
router.post("/cycles", authenticateToken, isAdmin, createCycle);

export default router;
