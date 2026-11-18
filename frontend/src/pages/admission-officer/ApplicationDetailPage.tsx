import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api, { API_BASE_URL } from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { ProgressTracker } from "../../components/common/ProgressTracker";
import {
  FileCheck2,
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<any | null>(null);
  const [evaluators, setEvaluators] = useState<any[]>([]);
  const [selectedEvaluator, setSelectedEvaluator] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review modal state
  const [reviewDocId, setReviewDocId] = useState<number | null>(null);
  const [reviewDecision, setReviewDecision] = useState("VERIFIED");
  const [reviewRemarks, setReviewRemarks] = useState("");

  const loadDetails = async () => {
    try {
      const [appRes, evalRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get("/users?roleCode=EVALUATOR"),
      ]);
      setApp(appRes.data.data);
      setEvaluators(evalRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleDocumentReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewDocId) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post(`/documents/${reviewDocId}/review`, {
        decision: reviewDecision,
        remarks: reviewRemarks,
      });
      setMessage({ type: "success", text: `Document marked as ${reviewDecision}.` });
      setReviewDocId(null);
      setReviewRemarks("");
      loadDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Review failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerEligibility = async () => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await api.post(`/screening/eligibility/${id}`);
      const d = res.data.data;
      setMessage({
        type: d.isEligible ? "success" : "error",
        text: `Eligibility Check Completed: ${d.eligibilityStatus} (${d.actualPercentage}% vs ${d.minRequired}% cutoff).`,
      });
      loadDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Eligibility evaluation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignEvaluator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvaluator) return;

    setActionLoading(true);
    setMessage(null);

    try {
      await api.post("/screening/assign-evaluator", {
        applicationId: Number(id),
        evaluatorUserId: Number(selectedEvaluator),
      });
      setMessage({ type: "success", text: "Department evaluator assigned successfully." });
      setSelectedEvaluator("");
      loadDetails();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Assignment failed." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-slate-400">Loading screening file...</div>;
  if (!app) return <div className="text-center py-12 text-xs text-rose-500">Application not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/officer/applications"
          className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Applications Register
        </Link>
        <Badge variant={getStatusBadgeVariant(app.application_status)} size="md">
          {app.application_status}
        </Badge>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Primary summary */}
      <Card
        title={`Application Screening File: ${app.programme_name}`}
        subtitle={`Reference: ${app.application_reference} | Applicant: ${app.applicant_name} (${app.applicant_email})`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Academic Cycle</span>
              <strong className="text-slate-800">{app.cycle_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Current Stage</span>
              <strong className="text-blue-700">{app.stage_name} (Stage {app.stage_order}/5)</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Submission Date</span>
              <strong className="text-slate-800">
                {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Draft"}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Qualifying Exam</span>
              <strong className="text-slate-800">{app.qualification}</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <ProgressTracker
              currentStageOrder={app.stage_order || 1}
              applicationStatus={app.application_status}
            />
          </div>
        </div>
      </Card>

      {/* Stage 2: Document Verification Section */}
      <Card
        title="Stage 2: Document Verification Register"
        subtitle="Review uploaded candidate documents and approve, reject, or request clarification"
      >
        <div className="space-y-4">
          {app.documents?.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No documents uploaded by applicant yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Document</th>
                    <th className="py-2.5 px-3">Filename</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Officer Remarks</th>
                    <th className="py-2.5 px-3 text-right">View / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {app.documents?.map((d: any) => (
                    <tr key={d.document_id}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{d.document_name}</td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{d.original_filename}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={getStatusBadgeVariant(d.upload_status)} size="sm">
                          {d.upload_status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{d.review_remarks || "-"}</td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <a
                          href={`${API_BASE_URL}/documents/${d.document_id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          View File
                        </a>
                        <button
                          onClick={() => {
                            setReviewDocId(d.document_id);
                            setReviewDecision("VERIFIED");
                            setReviewRemarks(d.review_remarks || "");
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Document review modal form */}
          {reviewDocId && (
            <form onSubmit={handleDocumentReview} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-800">Record Verification Decision for Document #{reviewDocId}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Decision</label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="VERIFIED">VERIFIED (Approve Document)</option>
                    <option value="CLARIFICATION_REQUESTED">CLARIFICATION_REQUESTED (Query Applicant)</option>
                    <option value="REJECTED">REJECTED (Invalid / Illegible)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Remarks</label>
                  <input
                    type="text"
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="e.g. Marks match secondary school certificate"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDocId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                >
                  Save Decision
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Stage 3: Academic Eligibility Screening */}
      <Card
        title="Stage 3: Academic Eligibility Screening (Rule-Based)"
        subtitle="Evaluates academic cutoff rules from eligibility_rules against applicant's education percentage"
      >
        <div className="space-y-4">
          {app.eligibilityEvaluation ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Eligibility Status: <strong className="text-blue-700">{app.eligibilityEvaluation.eligibility_status}</strong>
                </span>
                <Badge variant={getStatusBadgeVariant(app.eligibilityEvaluation.eligibility_status)}>
                  {app.eligibilityEvaluation.eligibility_status}
                </Badge>
              </div>
              <div className="text-xs text-slate-600">
                Applicant Aggregate: <strong>{app.eligibilityEvaluation.total_percentage}%</strong> | Minimum Required Cutoff: <strong>{app.eligibilityEvaluation.minimum_percentage}%</strong>
              </div>
              <p className="text-xs text-slate-500">{app.eligibilityEvaluation.remarks}</p>
              <div className="text-[10px] text-slate-400">
                Evaluated by {app.eligibilityEvaluation.evaluated_by_name} on {new Date(app.eligibilityEvaluation.evaluated_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-blue-900">Execute Automated Eligibility Check</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Reads eligibility rules for {app.programme_code} and evaluates candidate qualification marks.
                </p>
              </div>
              <button
                onClick={handleTriggerEligibility}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
              >
                <GraduationCap className="w-4 h-4" /> Run Eligibility Evaluation
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Stage 4: Assign Evaluator Section */}
      <Card
        title="Stage 4: Department Evaluator Assignment"
        subtitle="Delegate application review to academic faculty evaluators"
      >
        <form onSubmit={handleAssignEvaluator} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={selectedEvaluator}
            onChange={(e) => setSelectedEvaluator(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Faculty Evaluator</option>
            {evaluators.map((ev) => (
              <option key={ev.user_id} value={ev.user_id}>
                {ev.full_name} ({ev.email}) - {ev.department || "Evaluator"}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={actionLoading || !selectedEvaluator}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs shrink-0 disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" /> Assign Evaluator
          </button>
        </form>
      </Card>
    </div>
  );
};
