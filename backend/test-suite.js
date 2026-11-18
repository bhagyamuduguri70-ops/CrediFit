import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://localhost:5000";

const results = [];
function record(testName, status, details = "") {
  results.push({ testName, status, details });
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${status}] ${testName} - ${details}`);
}

async function run() {
  console.log("=== CrediFit Comprehensive Automated API & Workflow Test Suite ===");

  let applicantToken = null;
  let applicantId = null;
  let adminToken = null;
  let officerToken = null;
  let evaluatorToken = null;
  let createdAppId = null;
  let uploadedDocId = null;
  let createdClarificationId = null;

  // 1. Health Checks
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (res.ok && data.database === "connected") {
      record("Health Check & DB Connectivity (/health)", "PASS", `Status: ${data.status}, Database: ${data.database}`);
    } else {
      record("Health Check & DB Connectivity (/health)", "FAIL", `Database status: ${data.database}`);
    }
  } catch (err) {
    record("Health Check & DB Connectivity (/health)", "FAIL", err.message);
  }

  // 2. Authentication - Registration
  const testEmail = `applicant_audit_${Date.now()}@credifit.demo`;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Audit Test Applicant",
        email: testEmail,
        password: "Password@123",
        phone: "9876543210",
        city: "Dharwad",
        state: "Karnataka",
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.accessToken) {
      applicantToken = data.data.accessToken;
      applicantId = data.data.user.userId;
      record("User Registration (POST /auth/register)", "PASS", `Registered user ID: ${applicantId}, Role: ${data.data.user.roleCode}`);
    } else {
      record("User Registration (POST /auth/register)", "FAIL", data.message || "Unknown error");
    }
  } catch (err) {
    record("User Registration (POST /auth/register)", "FAIL", err.message);
  }

  // 3. Authentication - Login
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "Password@123" }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.accessToken) {
      applicantToken = data.data.accessToken;
      record("Applicant Login (POST /auth/login)", "PASS", `Logged in as ${data.data.user.fullName}`);
    } else {
      record("Applicant Login (POST /auth/login)", "FAIL", data.message);
    }
  } catch (err) {
    record("Applicant Login (POST /auth/login)", "FAIL", err.message);
  }

  // Staff logins
  for (const staff of [
    { email: "admin@credifit.demo", role: "ADMIN", key: "admin" },
    { email: "officer1@credifit.demo", role: "ADMISSION_OFFICER", key: "officer" },
    { email: "evaluator1@credifit.demo", role: "EVALUATOR", key: "evaluator" },
  ]) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: staff.email, password: "Demo@1234" }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.accessToken) {
        if (staff.key === "admin") adminToken = data.data.accessToken;
        if (staff.key === "officer") officerToken = data.data.accessToken;
        if (staff.key === "evaluator") evaluatorToken = data.data.accessToken;
        record(`${staff.role} Login (POST /auth/login)`, "PASS", `Token issued for ${staff.email}`);
      } else {
        record(`${staff.role} Login (POST /auth/login)`, "FAIL", data.message);
      }
    } catch (err) {
      record(`${staff.role} Login (POST /auth/login)`, "FAIL", err.message);
    }
  }

  // 4. Auth Profile (GET /auth/me)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data.email === testEmail) {
      record("Get Current User (GET /auth/me)", "PASS", `Retrieved profile for ${data.data.fullName}`);
    } else {
      record("Get Current User (GET /auth/me)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Current User (GET /auth/me)", "FAIL", err.message);
  }

  // 5. Applicant Profile Update
  try {
    const res = await fetch(`${BASE_URL}/api/v1/applicants/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({
        dateOfBirth: "2005-05-15",
        gender: "Male",
        address: "42 Knowledge Park",
        city: "Hubballi",
        state: "Karnataka",
        pincode: "580030",
        nationality: "Indian",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Update Applicant Profile (PUT /applicants/profile)", "PASS", data.message);
    } else {
      record("Update Applicant Profile (PUT /applicants/profile)", "FAIL", data.message);
    }
  } catch (err) {
    record("Update Applicant Profile (PUT /applicants/profile)", "FAIL", err.message);
  }

  // 6. Add Education Record
  try {
    const res = await fetch(`${BASE_URL}/api/v1/applicants/education`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({
        qualification: "12TH",
        institution: "Karnataka State Pre-University College",
        board: "Karnataka State Board",
        yearOfPassing: 2024,
        marksObtained: 510,
        maximumMarks: 600,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Add Education Record (POST /applicants/education)", "PASS", `Stored: ${data.data.percentage}% aggregate`);
    } else {
      record("Add Education Record (POST /applicants/education)", "FAIL", data.message);
    }
  } catch (err) {
    record("Add Education Record (POST /applicants/education)", "FAIL", err.message);
  }

  // 7. Get Education Records
  try {
    const res = await fetch(`${BASE_URL}/api/v1/applicants/education`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
      record("List Education Records (GET /applicants/education)", "PASS", `Found ${data.data.length} qualification(s)`);
    } else {
      record("List Education Records (GET /applicants/education)", "FAIL", data.message);
    }
  } catch (err) {
    record("List Education Records (GET /applicants/education)", "FAIL", err.message);
  }

  // 8. Courses & Catalog
  let targetProgId = 1;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/courses/programmes`);
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
      targetProgId = data.data[0].programme_id;
      record("List Active Catalog Programmes (GET /courses/programmes)", "PASS", `Retrieved ${data.data.length} programmes (e.g. ${data.data.map(p => p.programme_code).join(", ")})`);
    } else {
      record("List Active Catalog Programmes (GET /courses/programmes)", "FAIL", data.message);
    }
  } catch (err) {
    record("List Active Catalog Programmes (GET /courses/programmes)", "FAIL", err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/v1/courses/programmes/${targetProgId}`);
    const data = await res.json();
    if (res.ok && data.success && data.data.programme_id === targetProgId) {
      record("Get Programme Details & Document Checklist (GET /courses/programmes/:id)", "PASS", `${data.data.programme_name}: ${data.data.requiredDocuments?.length} required doc types`);
    } else {
      record("Get Programme Details & Document Checklist (GET /courses/programmes/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Programme Details & Document Checklist (GET /courses/programmes/:id)", "FAIL", err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/v1/courses/cycles`);
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      record("List Admission Cycles (GET /courses/cycles)", "PASS", `Retrieved ${data.data.length} cycles`);
    } else {
      record("List Admission Cycles (GET /courses/cycles)", "FAIL", data.message);
    }
  } catch (err) {
    record("List Admission Cycles (GET /courses/cycles)", "FAIL", err.message);
  }

  // 9. Stage 1: Create Application Draft
  try {
    const res = await fetch(`${BASE_URL}/api/v1/applications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({
        programmeId: targetProgId,
        qualification: "12TH",
        personalStatement: "Passionate about computer science and software development.",
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.applicationId) {
      createdAppId = data.data.applicationId;
      record("Stage 1 - Create Application Draft (POST /applications)", "PASS", `Application ID: ${createdAppId}, Ref: ${data.data.applicationReference}`);
    } else {
      record("Stage 1 - Create Application Draft (POST /applications)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 1 - Create Application Draft (POST /applications)", "FAIL", err.message);
  }

  // 10. Stage 1: Submit Application Draft -> Advance to Stage 2
  try {
    const res = await fetch(`${BASE_URL}/api/v1/applications/${createdAppId}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Stage 1 - Submit Application (POST /applications/:id/submit)", "PASS", "Advanced to Stage 2 (Document Verification)");
    } else {
      record("Stage 1 - Submit Application (POST /applications/:id/submit)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 1 - Submit Application (POST /applications/:id/submit)", "FAIL", err.message);
  }

  // 11. Document Types
  let docTypeId = 1;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/types`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
      docTypeId = data.data[0].document_type_id;
      record("Get Document Types (GET /documents/types)", "PASS", `Retrieved ${data.data.length} document types`);
    } else {
      record("Get Document Types (GET /documents/types)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Document Types (GET /documents/types)", "FAIL", err.message);
  }

  // 12. Stage 2: Upload Document
  try {
    // Create a temporary dummy PDF file to upload
    const dummyPath = path.resolve("./uploads/sample_test.pdf");
    if (!fs.existsSync(path.dirname(dummyPath))) fs.mkdirSync(path.dirname(dummyPath), { recursive: true });
    fs.writeFileSync(dummyPath, "%PDF-1.4 CrediFit Test Document");

    const formData = new FormData();
    formData.append("applicationId", String(createdAppId));
    formData.append("documentTypeId", String(docTypeId));
    const fileBlob = new Blob([fs.readFileSync(dummyPath)], { type: "application/pdf" });
    formData.append("file", fileBlob, "12th_Marksheet.pdf");

    const res = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${applicantToken}` },
      body: formData,
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.documentId) {
      uploadedDocId = data.data.documentId;
      record("Stage 2 - Upload Document (POST /documents/upload)", "PASS", `Document ID: ${uploadedDocId}, File: ${data.data.originalFilename}`);
    } else {
      record("Stage 2 - Upload Document (POST /documents/upload)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 2 - Upload Document (POST /documents/upload)", "FAIL", err.message);
  }

  // 13. Get Application Documents
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/application/${createdAppId}`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
      record("Get Application Documents (GET /documents/application/:id)", "PASS", `Retrieved ${data.data.length} document(s)`);
    } else {
      record("Get Application Documents (GET /documents/application/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Application Documents (GET /documents/application/:id)", "FAIL", err.message);
  }

  // 14. Stage 2: Officer Reviews Document (VERIFIED)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/documents/${uploadedDocId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        decision: "VERIFIED",
        remarks: "12th Standard marks card verified with state board register.",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Stage 2 - Document Verification Review (POST /documents/:id/review)", "PASS", `Decision: ${data.data.decision}, AllMandatoryVerified: ${data.data.allMandatoryVerified}`);
    } else {
      record("Stage 2 - Document Verification Review (POST /documents/:id/review)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 2 - Document Verification Review (POST /documents/:id/review)", "FAIL", err.message);
  }

  // 15. Stage 3: Automated Eligibility Screening
  try {
    const res = await fetch(`${BASE_URL}/api/v1/screening/eligibility/${createdAppId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.isEligible) {
      record("Stage 3 - Eligibility Screening (POST /screening/eligibility/:id)", "PASS", `Result: ${data.data.eligibilityStatus} (${data.data.actualPercentage}% vs cutoff ${data.data.minRequired}%)`);
    } else {
      record("Stage 3 - Eligibility Screening (POST /screening/eligibility/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 3 - Eligibility Screening (POST /screening/eligibility/:id)", "FAIL", err.message);
  }

  // 16. Stage 3: Get Eligibility Record
  try {
    const res = await fetch(`${BASE_URL}/api/v1/screening/eligibility/${createdAppId}`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.eligibility_status) {
      record("Get Eligibility Evaluation (GET /screening/eligibility/:id)", "PASS", `Status: ${data.data.eligibility_status}, Itemized checks: ${data.data.checks?.length}`);
    } else {
      record("Get Eligibility Evaluation (GET /screening/eligibility/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Eligibility Evaluation (GET /screening/eligibility/:id)", "FAIL", err.message);
  }

  // 17. Stage 4: Assign Evaluator
  try {
    const res = await fetch(`${BASE_URL}/api/v1/screening/assign-evaluator`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        applicationId: createdAppId,
        evaluatorUserId: 129, // evaluator1
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Stage 4 - Assign Faculty Evaluator (POST /screening/assign-evaluator)", "PASS", data.message);
    } else {
      record("Stage 4 - Assign Faculty Evaluator (POST /screening/assign-evaluator)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 4 - Assign Faculty Evaluator (POST /screening/assign-evaluator)", "FAIL", err.message);
  }

  // 18. Stage 4: Evaluator Queue
  try {
    const res = await fetch(`${BASE_URL}/api/v1/screening/evaluator/assignments`, {
      headers: { Authorization: `Bearer ${evaluatorToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      record("Stage 4 - Evaluator Queue (GET /screening/evaluator/assignments)", "PASS", `Found ${data.data.length} assigned applications`);
    } else {
      record("Stage 4 - Evaluator Queue (GET /screening/evaluator/assignments)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 4 - Evaluator Queue (GET /screening/evaluator/assignments)", "FAIL", err.message);
  }

  // 19. Stage 4: Load Programme Scoring Rubric
  let rubricId = 1;
  let criteriaList = [];
  try {
    const res = await fetch(`${BASE_URL}/api/v1/screening/rubrics/programme/${targetProgId}`, {
      headers: { Authorization: `Bearer ${evaluatorToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.rubric_id) {
      rubricId = data.data.rubric_id;
      criteriaList = data.data.criteria || [];
      record("Stage 4 - Load Scoring Rubric (GET /screening/rubrics/programme/:id)", "PASS", `${data.data.rubric_name} (${criteriaList.length} weighted criteria)`);
    } else {
      record("Stage 4 - Load Scoring Rubric (GET /screening/rubrics/programme/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 4 - Load Scoring Rubric (GET /screening/rubrics/programme/:id)", "FAIL", err.message);
  }

  // 20. Stage 4: Submit Department Review
  try {
    const scores = criteriaList.map(c => ({
      criterionId: c.criterion_id,
      score: 88,
      remarks: "Strong academic record and communication proficiency.",
    }));

    const res = await fetch(`${BASE_URL}/api/v1/screening/department-review/${createdAppId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${evaluatorToken}`,
      },
      body: JSON.stringify({
        rubricId,
        recommendation: "RECOMMEND",
        remarks: "Candidate demonstrates exceptional quantitative skills. Recommended for admission.",
        conflictConfirmed: true,
        scores,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Stage 4 - Department Merit Review (POST /screening/department-review/:id)", "PASS", "Submitted RECOMMEND; Advanced to Stage 5");
    } else {
      record("Stage 4 - Department Merit Review (POST /screening/department-review/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 4 - Department Merit Review (POST /screening/department-review/:id)", "FAIL", err.message);
  }

  // 21. Stage 5: Final Admission Decision (Admin)
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admission/${createdAppId}/decision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        decision: "ADMITTED",
        remarks: "Formal admission offered. Seat confirmed under merit quota.",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Stage 5 - Final Admission Decision (POST /admission/:id/decision)", "PASS", "Decision recorded: ADMITTED");
    } else {
      record("Stage 5 - Final Admission Decision (POST /admission/:id/decision)", "FAIL", data.message);
    }
  } catch (err) {
    record("Stage 5 - Final Admission Decision (POST /admission/:id/decision)", "FAIL", err.message);
  }

  // 22. Stage 5: Get Final Decision Certificate
  try {
    const res = await fetch(`${BASE_URL}/api/v1/admission/${createdAppId}`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && data.data?.decision === "ADMITTED") {
      record("Get Final Admission Certificate (GET /admission/:id)", "PASS", `Decision: ${data.data.decision}, Programme: ${data.data.programme_name}`);
    } else {
      record("Get Final Admission Certificate (GET /admission/:id)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get Final Admission Certificate (GET /admission/:id)", "FAIL", err.message);
  }

  // 23. Clarifications Workflow
  try {
    const res = await fetch(`${BASE_URL}/api/v1/clarifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${officerToken}`,
      },
      body: JSON.stringify({
        applicationId: createdAppId,
        clarificationType: "DOCUMENT",
        requestMessage: "Please verify if transfer certificate has been countersigned by BEO.",
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.success && data.data?.clarificationId) {
      createdClarificationId = data.data.clarificationId;
      record("Raise Clarification Request (POST /clarifications)", "PASS", `Clarification ID: ${createdClarificationId}`);
    } else {
      record("Raise Clarification Request (POST /clarifications)", "FAIL", data.message);
    }
  } catch (err) {
    record("Raise Clarification Request (POST /clarifications)", "FAIL", err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/v1/clarifications/${createdClarificationId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${applicantToken}`,
      },
      body: JSON.stringify({
        applicantResponse: "Yes, the BEO counter-signature is on page 2 of the uploaded document.",
      }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      record("Respond to Clarification Request (POST /clarifications/:id/respond)", "PASS", data.message);
    } else {
      record("Respond to Clarification Request (POST /clarifications/:id/respond)", "FAIL", data.message);
    }
  } catch (err) {
    record("Respond to Clarification Request (POST /clarifications/:id/respond)", "FAIL", err.message);
  }

  // 24. Notifications
  try {
    const res = await fetch(`${BASE_URL}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${applicantToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      record("Get User Notifications (GET /notifications)", "PASS", `Retrieved ${data.data.length} notifications`);
      if (data.data.length > 0) {
        const notifId = data.data[0].notification_id;
        const readRes = await fetch(`${BASE_URL}/api/v1/notifications/${notifId}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${applicantToken}` },
        });
        const readData = await readRes.json();
        if (readRes.ok && readData.success) {
          record("Mark Notification as Read (PATCH /notifications/:id/read)", "PASS", "Notification marked read");
        }
      }
    } else {
      record("Get User Notifications (GET /notifications)", "FAIL", data.message);
    }
  } catch (err) {
    record("Get User Notifications (GET /notifications)", "FAIL", err.message);
  }

  // 25. Dashboards
  for (const dash of [
    { role: "ADMIN", url: "/api/v1/dashboard/admin", token: adminToken },
    { role: "ADMISSION_OFFICER", url: "/api/v1/dashboard/officer", token: officerToken },
    { role: "EVALUATOR", url: "/api/v1/dashboard/evaluator", token: evaluatorToken },
    { role: "APPLICANT", url: "/api/v1/dashboard/applicant", token: applicantToken },
  ]) {
    try {
      const res = await fetch(`${BASE_URL}${dash.url}`, {
        headers: { Authorization: `Bearer ${dash.token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        record(`${dash.role} Dashboard Metrics (GET ${dash.url})`, "PASS", "Dashboard metrics calculated and returned");
      } else {
        record(`${dash.role} Dashboard Metrics (GET ${dash.url})`, "FAIL", data.message);
      }
    } catch (err) {
      record(`${dash.role} Dashboard Metrics (GET ${dash.url})`, "FAIL", err.message);
    }
  }

  // 26. Users & Audit Logs
  try {
    const res = await fetch(`${BASE_URL}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      record("List System Users (GET /users)", "PASS", `Found ${data.data.length} users in database`);
    } else {
      record("List System Users (GET /users)", "FAIL", data.message);
    }
  } catch (err) {
    record("List System Users (GET /users)", "FAIL", err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/api/v1/users/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data)) {
      record("List System Audit Logs (GET /users/audit-logs)", "PASS", `Retrieved ${data.data.length} audit entries`);
    } else {
      record("List System Audit Logs (GET /users/audit-logs)", "FAIL", data.message);
    }
  } catch (err) {
    record("List System Audit Logs (GET /users/audit-logs)", "FAIL", err.message);
  }

  // Summary
  console.log("\n================ TEST SUMMARY ================");
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  console.log(`TOTAL: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("==============================================\n");

  fs.writeFileSync("./test-results.json", JSON.stringify(results, null, 2));
}

run();
