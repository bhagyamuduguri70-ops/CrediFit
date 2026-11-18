import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download,
  Eye,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";

export const DocumentVerificationHubPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review modal state
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [reviewDecision, setReviewDecision] = useState("VERIFIED");
  const [reviewRemarks, setReviewRemarks] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post(`/documents/${selectedDoc.document_id}/review`, {
        decision: reviewDecision,
        remarks: reviewRemarks || `Audited by admission officer. Decision: ${reviewDecision}`,
      });

      setMessage({
        type: "success",
        text: `Document '${selectedDoc.document_name}' marked as ${reviewDecision}.`,
      });

      setSelectedDoc(null);
      setReviewRemarks("");
      loadDocuments();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to submit document review.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.application_reference?.toLowerCase().includes(search.toLowerCase()) ||
      doc.document_name?.toLowerCase().includes(search.toLowerCase()) ||
      doc.original_filename?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && (doc.upload_status === "UPLOADED" || doc.upload_status === "PENDING")) ||
      doc.upload_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Document Verification Hub
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Stage 2 verification: Inspect uploaded certificates, approve genuine documents, or request clarifications.
          </p>
        </div>

        <button
          onClick={loadDocuments}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Search and Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, ref #, or doc name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="PENDING">Pending / Uploaded</option>
              <option value="VERIFIED">Verified (Pass)</option>
              <option value="REJECTED">Rejected (Fail)</option>
              <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Documents Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#2563EB]" />
            <span>Document Verification Queue</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {filtered.length} Documents
            </span>
          </div>
        }
      >
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Document Name & Type</th>
                <th>Applicant / Reference</th>
                <th>File Details</th>
                <th>Uploaded Date</th>
                <th>Verification Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    Loading verification records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    No documents found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.document_id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{doc.document_name}</div>
                          <div className="text-[11px] text-slate-400">{doc.original_filename}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{doc.applicant_name}</div>
                      <div className="font-mono text-[10px] text-blue-700">
                        {doc.application_reference}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500">
                      <span className="font-mono uppercase text-[10px] px-1.5 py-0.5 bg-slate-100 rounded mr-1.5">
                        {doc.file_type ? doc.file_type.split("/")[1] || "FILE" : "PDF"}
                      </span>
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : "N/A"}
                    </td>
                    <td className="text-xs text-slate-500">
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Recent"}
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(doc.upload_status)} dot>
                        {doc.upload_status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download link */}
                        <a
                          href={`${API_BASE_URL}/documents/${doc.document_id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download document file"
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Audit action button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setReviewDecision(doc.upload_status === "VERIFIED" ? "VERIFIED" : "VERIFIED");
                            setReviewRemarks(doc.review_remarks || "");
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#142B4F] hover:bg-[#0d1e38] text-white rounded-md transition-colors cursor-pointer"
                        >
                          Verify / Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Audit Document: {selectedDoc.document_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applicant: {selectedDoc.applicant_name} ({selectedDoc.application_reference})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-semibold text-slate-800">{selectedDoc.original_filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">File Type & Size:</span>
                  <span className="font-medium text-slate-700">
                    {selectedDoc.file_type} ({Math.round(selectedDoc.file_size / 1024)} KB)
                  </span>
                </div>
                <div className="pt-2">
                  <a
                    href={`${API_BASE_URL}/documents/${selectedDoc.document_id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download & Open Original File</span>
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Verification Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewDecision("VERIFIED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      reviewDecision === "VERIFIED"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Approve (PASS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("REJECTED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      reviewDecision === "REJECTED"
                        ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Reject (FAIL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewDecision("CLARIFICATION_REQUESTED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      reviewDecision === "CLARIFICATION_REQUESTED"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Clarify (PENDING)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verification Remarks / Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Enter verification notes or specific deficiency reason for the candidate..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#142B4F] hover:bg-[#0d1e38] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? "Saving Audit..." : "Record Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
