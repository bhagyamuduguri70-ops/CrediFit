import { Router } from "express";
import {
  getDocumentTypes,
  uploadDoc,
  getApplicationDocuments,
  downloadDocument,
  reviewDocument,
  getAllDocuments,
} from "../controllers/documentController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { uploadDocument } from "../middleware/uploadMiddleware.js";
import { isOfficerOrAdmin } from "../middleware/roleMiddleware.js";

const router = Router();

router.use(authenticateToken);

// Document types reference
router.get("/types", getDocumentTypes);

// List all documents (Officer/Admin hub)
router.get("/", isOfficerOrAdmin, getAllDocuments);

// Upload document
router.post("/upload", uploadDocument.single("file"), uploadDoc);

// List documents for an application
router.get("/application/:applicationId", getApplicationDocuments);

// Download document
router.get("/:id/download", downloadDocument);

// Review document (Officer/Admin)
router.post("/:id/review", isOfficerOrAdmin, reviewDocument);

export default router;
