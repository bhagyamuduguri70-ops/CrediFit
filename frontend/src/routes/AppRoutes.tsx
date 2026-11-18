import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DashboardLayout } from "../layouts/DashboardLayout";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";

// Applicant Pages
import { ApplicantDashboard } from "../pages/applicant/ApplicantDashboard";
import { ProfilePage } from "../pages/applicant/ProfilePage";
import { EducationPage } from "../pages/applicant/EducationPage";
import { ProgrammeCatalogPage } from "../pages/applicant/ProgrammeCatalogPage";
import { ApplicationFormPage } from "../pages/applicant/ApplicationFormPage";
import { MyApplicationsPage } from "../pages/applicant/MyApplicationsPage";
import { ClarificationsPage } from "../pages/applicant/ClarificationsPage";

// Officer Pages
import { OfficerDashboard } from "../pages/admission-officer/OfficerDashboard";
import { ApplicantListPage } from "../pages/admission-officer/ApplicantListPage";
import { ApplicationDetailPage } from "../pages/admission-officer/ApplicationDetailPage";
import { DocumentVerificationPage } from "../pages/admission-officer/DocumentVerificationPage";
import { ClarificationManagementPage } from "../pages/admission-officer/ClarificationManagementPage";

// Evaluator Pages
import { EvaluatorDashboard } from "../pages/evaluator/EvaluatorDashboard";
import { AssignedApplicationsPage } from "../pages/evaluator/AssignedApplicationsPage";
import { EvaluationRubricPage } from "../pages/evaluator/EvaluationRubricPage";

// Admin & Enterprise Management Pages
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { ApplicantManagementPage } from "../pages/admin/ApplicantManagementPage";
import { CourseManagementPage } from "../pages/admin/CourseManagementPage";
import { ApplicationManagementPage } from "../pages/admin/ApplicationManagementPage";
import { DocumentVerificationHubPage } from "../pages/admin/DocumentVerificationHubPage";
import { StageScreeningHubPage } from "../pages/admin/StageScreeningHubPage";
import { MeritListPage } from "../pages/admin/MeritListPage";
import { ReportsPage } from "../pages/admin/ReportsPage";
import { SettingsPage } from "../pages/admin/SettingsPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { AdmissionCyclePage } from "../pages/admin/AdmissionCyclePage";
import { FinalDecisionPage } from "../pages/admin/FinalDecisionPage";
import { AuditLogsPage } from "../pages/admin/AuditLogsPage";

// Role-based route guard
const ProtectedRoute: React.FC<{
  allowedRoles?: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#142B4F] text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
          <span>Verifying CrediFit authentication...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.roleCode)) {
    switch (user.roleCode) {
      case "APPLICANT":
        return <Navigate to="/applicant/dashboard" replace />;
      case "ADMISSION_OFFICER":
        return <Navigate to="/officer/dashboard" replace />;
      case "EVALUATOR":
        return <Navigate to="/evaluator/dashboard" replace />;
      case "ADMIN":
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

// Root index redirect
const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  switch (user.roleCode) {
    case "APPLICANT":
      return <Navigate to="/applicant/dashboard" replace />;
    case "ADMISSION_OFFICER":
      return <Navigate to="/officer/dashboard" replace />;
    case "EVALUATOR":
      return <Navigate to="/evaluator/dashboard" replace />;
    case "ADMIN":
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Protected Dashboard Shell */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* APPLICANT ROUTES */}
          <Route
            path="/applicant/dashboard"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <ApplicantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/profile"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT", "ADMIN", "ADMISSION_OFFICER", "EVALUATOR"]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/education"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <EducationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/programmes"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <ProgrammeCatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/apply"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <ApplicationFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/applications"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/clarifications"
            element={
              <ProtectedRoute allowedRoles={["APPLICANT"]}>
                <ClarificationsPage />
              </ProtectedRoute>
            }
          />

          {/* ADMISSION OFFICER ROUTES */}
          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/applicants"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <ApplicantManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/applications"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <ApplicationManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/applications/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <ApplicationDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/documents"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <DocumentVerificationHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/clarifications"
            element={
              <ProtectedRoute allowedRoles={["ADMISSION_OFFICER", "ADMIN"]}>
                <ClarificationManagementPage />
              </ProtectedRoute>
            }
          />

          {/* EVALUATOR ROUTES */}
          <Route
            path="/evaluator/dashboard"
            element={
              <ProtectedRoute allowedRoles={["EVALUATOR", "ADMIN"]}>
                <EvaluatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluator/assignments"
            element={
              <ProtectedRoute allowedRoles={["EVALUATOR", "ADMIN"]}>
                <AssignedApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evaluator/rubric/:applicationId"
            element={
              <ProtectedRoute allowedRoles={["EVALUATOR", "ADMIN"]}>
                <EvaluationRubricPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN & ENTERPRISE DASHBOARD ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applicants"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <ApplicantManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <CourseManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/programmes"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <CourseManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <ApplicationManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <DocumentVerificationHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/screening"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <StageScreeningHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/merit-list"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <MeritListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/decisions"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <FinalDecisionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER"]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/cycles"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdmissionCyclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "ADMISSION_OFFICER", "EVALUATOR", "APPLICANT"]}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
