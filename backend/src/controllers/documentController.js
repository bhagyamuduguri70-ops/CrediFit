import path from "node:path";
import fs from "node:fs";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { logAudit } from "../services/auditService.js";
import { advanceStage } from "../services/screeningService.js";
import { createNotification } from "../services/notificationService.js";

export async function getDocumentTypes(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT document_type_id, document_code, document_name, description, is_active
       FROM document_types
       WHERE is_active = 1
       ORDER BY document_name ASC`
    );
    return sendSuccess(res, "Document types retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function uploadDoc(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { applicationId, documentTypeId } = req.body;
    const file = req.file;

    if (!file) {
      return sendError(res, "No file uploaded. Please select a valid document.", 400);
    }

    if (!applicationId || !documentTypeId) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return sendError(res, "Application ID and Document Type ID are required.", 400);
    }

    await connection.beginTransaction();

    const [appRows] = await connection.execute(
      "SELECT application_id, applicant_user_id, application_status FROM applications WHERE application_id = ? LIMIT 1",
      [applicationId]
    );

    const app = appRows[0];
    if (!app) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return sendError(res, "Application not found.", 404);
    }

    if (req.user.role_code === "APPLICANT" && app.applicant_user_id !== req.user.user_id) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return sendError(res, "Access denied.", 403);
    }

    // Insert metadata into application_documents
    const relativeFilePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");

    const [result] = await connection.execute(
      `INSERT INTO application_documents (
        application_id, document_type_id, uploaded_by, original_filename,
        stored_filename, file_path, file_type, file_size, upload_status, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPLOADED', CURRENT_TIMESTAMP)`,
      [
        applicationId,
        documentTypeId,
        req.user.user_id,
        file.originalname,
        file.filename,
        relativeFilePath,
        file.mimetype,
        file.size,
      ]
    );

    const documentId = result.insertId;

    await logAudit({
      userId: req.user.user_id,
      action: "UPLOAD_DOCUMENT",
      entityName: "application_documents",
      entityId: documentId,
      newValues: {
        applicationId,
        documentTypeId,
        originalFilename: file.originalname,
        size: file.size,
      },
      ipAddress: req.ip,
      connection,
    });

    await connection.commit();

    return sendSuccess(
      res,
      "Document uploaded successfully.",
      {
        documentId,
        applicationId,
        documentTypeId,
        originalFilename: file.originalname,
        storedFilename: file.filename,
        uploadStatus: "UPLOADED",
      },
      201
    );
  } catch (error) {
    await connection.rollback();
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getApplicationDocuments(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);

    const [rows] = await pool.execute(
      `SELECT ad.document_id, ad.application_id, ad.document_type_id, ad.uploaded_by,
              ad.original_filename, ad.stored_filename, ad.file_path, ad.file_type,
              ad.file_size, ad.upload_status, ad.uploaded_at,
              dt.document_code, dt.document_name, dt.description,
              dr.decision AS review_decision, dr.remarks AS review_remarks, dr.reviewed_at
       FROM application_documents ad
       JOIN document_types dt ON ad.document_type_id = dt.document_type_id
       LEFT JOIN document_reviews dr ON ad.document_id = dr.document_id
       WHERE ad.application_id = ?
       ORDER BY ad.uploaded_at DESC`,
      [applicationId]
    );

    return sendSuccess(res, "Documents retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}

export async function downloadDocument(req, res, next) {
  try {
    const documentId = Number(req.params.id);

    const [rows] = await pool.execute(
      `SELECT ad.document_id, ad.application_id, ad.uploaded_by, ad.stored_filename,
              ad.original_filename, ad.file_path, ad.file_type, a.applicant_user_id
       FROM application_documents ad
       JOIN applications a ON ad.application_id = a.application_id
       WHERE ad.document_id = ?
       LIMIT 1`,
      [documentId]
    );

    const doc = rows[0];
    if (!doc) {
      return sendError(res, "Document not found.", 404);
    }

    if (req.user.role_code === "APPLICANT" && doc.applicant_user_id !== req.user.user_id) {
      return sendError(res, "Access denied.", 403);
    }

    const fullPath = path.resolve(process.cwd(), doc.file_path);
    if (!fs.existsSync(fullPath)) {
      return sendError(res, "Document file missing on server storage.", 404);
    }

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.original_filename)}"`);
    res.setHeader("Content-Type", doc.file_type || "application/octet-stream");
    return fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    return next(error);
  }
}

export async function reviewDocument(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const documentId = Number(req.params.id);
    const { decision, remarks = "" } = req.body;

    if (!decision || !["VERIFIED", "CLARIFICATION_REQUESTED", "REJECTED"].includes(decision)) {
      return sendError(res, "Decision must be one of: VERIFIED, CLARIFICATION_REQUESTED, REJECTED.", 400);
    }

    await connection.beginTransaction();

    const [docRows] = await connection.execute(
      `SELECT ad.document_id, ad.application_id, ad.uploaded_by, ad.upload_status,
              a.applicant_user_id, a.programme_id, a.current_stage_id,
              dt.document_name
       FROM application_documents ad
       JOIN applications a ON ad.application_id = a.application_id
       JOIN document_types dt ON ad.document_type_id = dt.document_type_id
       WHERE ad.document_id = ?
       LIMIT 1`,
      [documentId]
    );

    const doc = docRows[0];
    if (!doc) {
      return sendError(res, "Document not found.", 404);
    }

    // Insert or update document_reviews
    await connection.execute(
      `INSERT INTO document_reviews (document_id, reviewer_user_id, decision, remarks, reviewed_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [documentId, req.user.user_id, decision, remarks]
    );

    // Update status on application_documents
    await connection.execute(
      `UPDATE application_documents SET upload_status = ? WHERE document_id = ?`,
      [decision, documentId]
    );

    await logAudit({
      userId: req.user.user_id,
      action: "REVIEW_DOCUMENT",
      entityName: "document_reviews",
      entityId: documentId,
      newValues: { decision, remarks },
      ipAddress: req.ip,
      connection,
    });

    // Check if ALL mandatory documents for this programme are now VERIFIED
    const [mandatoryReqs] = await connection.execute(
      `SELECT document_type_id FROM programme_document_requirements
       WHERE programme_id = ? AND is_mandatory = 1`,
      [doc.programme_id]
    );

    let allMandatoryVerified = true;
    for (const reqItem of mandatoryReqs) {
      const [vRows] = await connection.execute(
        `SELECT document_id FROM application_documents
         WHERE application_id = ? AND document_type_id = ? AND upload_status = 'VERIFIED'
         LIMIT 1`,
        [doc.application_id, reqItem.document_type_id]
      );
      if (vRows.length === 0) {
        allMandatoryVerified = false;
        break;
      }
    }

    // If all mandatory documents verified and current stage is 2, advance to Stage 3: ELIGIBILITY_SCREENING
    if (allMandatoryVerified && doc.current_stage_id === 2) {
      await advanceStage({
        applicationId: doc.application_id,
        nextStageId: 3,
        stageStatus: "PASS",
        changedBy: req.user.user_id,
        remarks: "All mandatory documents verified. Advanced to Eligibility Screening.",
        connection,
      });

      await createNotification({
        userId: doc.applicant_user_id,
        title: "Documents Verified",
        message: `All required documents for application ${doc.application_id} have been verified. Your application is now in Eligibility Screening.`,
        notificationType: "DOCUMENT_VERIFIED",
        connection,
      });
    }

    await connection.commit();

    return sendSuccess(res, `Document review saved as ${decision}.`, {
      documentId,
      decision,
      allMandatoryVerified,
    });
  } catch (error) {
    await connection.rollback();
    return next(error);
  } finally {
    connection.release();
  }
}

export async function getAllDocuments(req, res, next) {
  try {
    const { status, search } = req.query;
    let query = `
      SELECT ad.document_id, ad.application_id, ad.document_type_id, ad.uploaded_by,
             ad.original_filename, ad.stored_filename, ad.file_path, ad.file_type,
             ad.file_size, ad.upload_status, ad.uploaded_at,
             dt.document_code, dt.document_name, dt.description,
             a.application_reference, a.current_stage_id,
             u.full_name AS applicant_name, u.email AS applicant_email,
             p.programme_code, p.programme_name,
             dr.decision AS review_decision, dr.remarks AS review_remarks, dr.reviewed_at
      FROM application_documents ad
      JOIN document_types dt ON ad.document_type_id = dt.document_type_id
      JOIN applications a ON ad.application_id = a.application_id
      JOIN users u ON a.applicant_user_id = u.user_id
      JOIN programmes p ON a.programme_id = p.programme_id
      LEFT JOIN document_reviews dr ON ad.document_id = dr.document_id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      query += ` AND ad.upload_status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (u.full_name LIKE ? OR a.application_reference LIKE ? OR dt.document_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY ad.uploaded_at DESC`;
    const [rows] = await pool.query(query, params);
    return sendSuccess(res, "All documents retrieved.", rows);
  } catch (error) {
    return next(error);
  }
}
