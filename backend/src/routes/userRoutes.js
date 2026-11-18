import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUserStatus,
  getAuditLogs,
  getRoles,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);
router.use(isAdmin);

router.get("/roles", getRoles);
router.get("/audit-logs", getAuditLogs);
router.get("/", listUsers);
router.post("/", createUser);
router.patch("/:id/status", updateUserStatus);

export default router;
