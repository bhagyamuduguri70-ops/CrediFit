export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export type RoleCode = "APPLICANT" | "ADMISSION_OFFICER" | "EVALUATOR" | "ADMIN";

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneCountryCode?: string;
  phone?: string;
  roleCode: RoleCode;
  roleName: string;
  emailVerified?: boolean;
}

export interface ApplicantProfile {
  applicantProfileId?: number;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  nationality?: string;
}

export interface EducationRecord {
  education_record_id: number;
  user_id: number;
  qualification: string;
  institution: string;
  board: string;
  year_of_passing: number;
  marks_obtained: number;
  maximum_marks: number;
  percentage: number;
}

export interface Programme {
  programme_id: number;
  programme_code: string;
  programme_name: string;
  description?: string;
  duration_years: number;
  qualification_required: string;
  programme_status: "ACTIVE" | "INACTIVE";
  required_documents_count?: number;
}

export interface AdmissionCycle {
  cycle_id: number;
  cycle_name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  cycle_status: string;
}

export interface Application {
  application_id: number;
  application_reference: string;
  applicant_user_id: number;
  programme_id: number;
  cycle_id?: number;
  current_stage_id: number;
  qualification: string;
  personal_statement?: string;
  application_status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ELIGIBLE" | "INELIGIBLE" | "ADMITTED" | "REJECTED";
  submitted_at?: string;
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  programme_name?: string;
  programme_code?: string;
  stage_name?: string;
  stage_code?: string;
  stage_order?: number;
  final_decision?: string;
}

export interface DocumentType {
  document_type_id: number;
  document_code: string;
  document_name: string;
  description?: string;
}

export interface ApplicationDocument {
  document_id: number;
  application_id: number;
  document_type_id: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  upload_status: "UPLOADED" | "VERIFIED" | "REJECTED" | "CLARIFICATION_REQUESTED";
  uploaded_at: string;
  document_name?: string;
  document_code?: string;
  review_decision?: string;
  review_remarks?: string;
}

export interface StageHistory {
  history_id: number;
  application_id: number;
  stage_id: number;
  stage_name: string;
  stage_order: number;
  stage_status: "PENDING" | "IN_PROGRESS" | "PASS" | "FAIL";
  changed_by?: number;
  changed_by_name?: string;
  remarks?: string;
  changed_at: string;
}

export interface Clarification {
  clarification_id: number;
  application_id: number;
  raised_by: number;
  assigned_to: number;
  clarification_type: string;
  request_message: string;
  applicant_response?: string;
  clarification_status: "PENDING" | "RESOLVED" | "CLOSED";
  requested_at: string;
  responded_at?: string;
  raised_by_name?: string;
}

export interface NotificationItem {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}
