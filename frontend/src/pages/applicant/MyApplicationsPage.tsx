import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { ProgressTracker } from "../../components/common/ProgressTracker";
import { Application, DocumentType, ApplicationDocument } from "../../types";
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Eye,
  FileCheck2,
} from "lucide-react";

export const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // File upload state
  const [uploadDocTypeId, setUploadDocTypeId] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadApplications = async () => {
    try {
      const [appsRes, docsRes] = await Promise.all([
        api.get("/applications/my"),
        api.get("/documents/types"),
      ]);
      const list = appsRes.data.data || [];
      setApplications(list);
      setDocTypes(docsRes.data.data || []);
      if (list.length > 0 && !selectedApp) {
        viewApplication(list[0].application_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = async (id: number) => {
    try {
      const res = await api.get(`/applications/${id}`);
      setSelectedApp(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleFormalSubmit = async (appId: number) => {
    if (!window.confirm("Submit your application formally for Document Verification? Ensure all academic qualifications are added.")) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await api.post(`/applications/${appId}/submit`);
      setMessage({ type: "success", text: "Application submitted successfully! Current stage: Document Verification." });
      loadApplications();
      viewApplication(appId);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Submission failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadDocTypeId || !selectedApp) return;

    setActionLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("applicationId", String(selectedApp.application_id));
    formData.append("documentTypeId", uploadDocTypeId);
    formData.append("file", uploadFile);

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage({ type: "success", text: "Document uploaded successfully." });
      setUploadFile(null);
      setUploadDocTypeId("");
      viewApplication(selectedApp.application_id);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Upload failed." });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">My Applications Register</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review application status, inspect stage-wise history, and upload admission documents.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-xs text-slate-500">No applications found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications list sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Your Applications</h3>
            {applications.map((app) => (
              <div
                key={app.application_id}
                onClick={() => viewApplication(app.application_id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedApp?.application_id === app.application_id
                    ? "bg-blue-50/50 border-blue-500 shadow-xs ring-1 ring-blue-500"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{app.programme_code}</span>
                  <Badge variant={getStatusBadgeVariant(app.application_status)} size="sm">
                    {app.application_status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-600 mt-1 truncate">{app.programme_name}</div>
                <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
                  <span>Ref: {app.application_reference}</span>
                  <span>Stage {app.stage_order}/5</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected application details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedApp && (
              <>
                <Card
                  title={`${selectedApp.programme_name} (${selectedApp.programme_code})`}
                  subtitle={`Reference: ${selectedApp.application_reference}`}
                  action={
                    <Badge variant={getStatusBadgeVariant(selectedApp.application_status)}>
                      {selectedApp.application_status}
                    </Badge>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Admission Cycle: <strong>{selectedApp.cycle_name}</strong></span>
                      <span>Qualifying Exam: <strong>{selectedApp.qualification}</strong></span>
                    </div>

                    {/* Progress Tracker */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 mb-1">Stage-Wise Progress:</div>
                      <ProgressTracker
                        currentStageOrder={selectedApp.stage_order || 1}
                        applicationStatus={selectedApp.application_status}
                      />
                    </div>

                    {/* Submit Draft Button */}
                    {selectedApp.application_status === "DRAFT" && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-amber-800">Draft Application</div>
                          <div className="text-[11px] text-amber-700">Submit to proceed to Document Verification stage.</div>
                        </div>
                        <button
                          onClick={() => handleFormalSubmit(selectedApp.application_id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Application
                        </button>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Document Upload & List */}
                <Card title="Submitted Admission Documents" subtitle="Upload PDF, JPG, or PNG files for stage 2 verification">
                  <div className="space-y-4">
                    {/* Upload form */}
                    <form onSubmit={handleFileUpload} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type</label>
                          <select
                            value={uploadDocTypeId}
                            onChange={(e) => setUploadDocTypeId(e.target.value)}
                            required
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Document Type</option>
                            {docTypes.map((dt) => (
                              <option key={dt.document_type_id} value={dt.document_type_id}>
                                {dt.document_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF, JPG, PNG)</label>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            required
                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={actionLoading || !uploadFile}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Document
                        </button>
                      </div>
                    </form>

                    {/* Uploaded documents table */}
                    {selectedApp.documents?.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No documents uploaded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">Document Type</th>
                              <th className="py-2 px-3">Filename</th>
                              <th className="py-2 px-3">Verification Status</th>
                              <th className="py-2 px-3">Officer Remarks</th>
                              <th className="py-2 px-3 text-right">Download</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedApp.documents?.map((doc: ApplicationDocument) => (
                              <tr key={doc.document_id}>
                                <td className="py-2 px-3 font-semibold text-slate-800">{doc.document_name}</td>
                                <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{doc.original_filename}</td>
                                <td className="py-2 px-3">
                                  <Badge variant={getStatusBadgeVariant(doc.upload_status)} size="sm">
                                    {doc.upload_status}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-slate-600">{doc.review_remarks || "-"}</td>
                                <td className="py-2 px-3 text-right">
                                  <a
                                    href={`${API_BASE_URL}/documents/${doc.document_id}/download`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:underline font-medium"
                                  >
                                    Download
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Stage History */}
                <Card title="Screening History & Audit Register">
                  <div className="space-y-3">
                    {selectedApp.stageHistory?.map((hist: any) => (
                      <div key={hist.history_id} className="flex items-start gap-3 text-xs p-3 bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {hist.stage_order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{hist.stage_name}</span>
                            <Badge variant={getStatusBadgeVariant(hist.stage_status)} size="sm">
                              {hist.stage_status}
                            </Badge>
                          </div>
                          <p className="text-slate-600 mt-1">{hist.remarks || "Stage logged."}</p>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(hist.changed_at).toLocaleString()} {hist.changed_by_name ? `by ${hist.changed_by_name}` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
