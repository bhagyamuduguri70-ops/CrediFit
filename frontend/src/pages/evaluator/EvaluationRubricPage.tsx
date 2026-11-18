import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { ArrowLeft, CheckCircle2, AlertCircle, Save } from "lucide-react";

export const EvaluationRubricPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [app, setApp] = useState<any | null>(null);
  const [rubric, setRubric] = useState<any | null>(null);
  const [scores, setScores] = useState<{ [criterionId: number]: number }>({});
  const [remarks, setRemarks] = useState("");
  const [recommendation, setRecommendation] = useState("RECOMMEND");
  const [conflictConfirmed, setConflictConfirmed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const appRes = await api.get(`/applications/${applicationId}`);
        const appData = appRes.data.data;
        setApp(appData);

        const rubricRes = await api.get(`/screening/rubrics/programme/${appData.programme_id}`);
        const rubricData = rubricRes.data.data;
        setRubric(rubricData);

        // Prepopulate default scores
        if (rubricData?.criteria) {
          const initialScores: { [id: number]: number } = {};
          rubricData.criteria.forEach((c: any) => {
            initialScores[c.criterion_id] = 80;
          });
          setScores(initialScores);
        }
      } catch (err: any) {
        setMessage({ type: "error", text: err.response?.data?.message || "Error loading rubric." });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [applicationId]);

  const handleScoreChange = (criterionId: number, val: number) => {
    setScores((prev) => ({ ...prev, [criterionId]: val }));
  };

  const calculateWeightedTotal = () => {
    if (!rubric?.criteria) return 0;
    let total = 0;
    rubric.criteria.forEach((c: any) => {
      const score = scores[c.criterion_id] || 0;
      const weight = Number(c.weight_percentage) || 0;
      total += (score * weight) / 100;
    });
    return total.toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conflictConfirmed) {
      alert("Please confirm no conflict of interest before submitting evaluation.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const scoresArray = Object.entries(scores).map(([critId, score]) => ({
      criterionId: Number(critId),
      score,
    }));

    try {
      await api.post(`/screening/department-review/${applicationId}`, {
        rubricId: rubric.rubric_id,
        recommendation,
        remarks,
        conflictConfirmed,
        scores: scoresArray,
      });

      setMessage({ type: "success", text: "Department review successfully recorded! Stage advanced to Final Admission Decision." });
      setTimeout(() => navigate("/evaluator/assignments"), 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit review." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-slate-400">Loading evaluation sheet...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/evaluator/assignments"
        className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Assigned Queue
      </Link>

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

      {app && (
        <Card
          title={`Evaluating Candidate: ${app.applicant_name}`}
          subtitle={`Application #${app.application_id} | Reference: ${app.application_reference} | Degree: ${app.programme_name}`}
        >
          <div className="text-xs text-slate-600 space-y-1">
            <div>Candidate Qualifying Exam: <strong>{app.qualification}</strong></div>
            {app.personal_statement && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-1">Candidate Statement:</span>
                <p className="italic">{app.personal_statement}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {rubric ? (
        <Card title={`Rubric: ${rubric.rubric_name}`} subtitle={rubric.description || "Weighted scoring criteria"}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {rubric.criteria?.map((c: any) => (
                <div key={c.criterion_id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{c.criterion_name}</h4>
                      <p className="text-[11px] text-slate-500">{c.description}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-bold">
                      Weight: {c.weight_percentage}%
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={scores[c.criterion_id] || 0}
                      onChange={(e) => handleScoreChange(c.criterion_id, Number(e.target.value))}
                      className="flex-1 accent-blue-600 cursor-pointer"
                    />
                    <div className="w-16 text-right font-bold text-xs text-blue-700">
                      {scores[c.criterion_id] || 0} / 100
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Computed weighted score summary */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-800 font-medium">Computed Weighted Aggregate Score:</span>
                <div className="text-2xl font-black text-blue-900">{calculateWeightedTotal()} / 100</div>
              </div>
              <Badge variant="primary">Stage 4 Merit Rating</Badge>
            </div>

            {/* Recommendation & Remarks */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Final Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RECOMMEND">RECOMMEND FOR ADMISSION</option>
                  <option value="DO_NOT_RECOMMEND">DO NOT RECOMMEND (REJECT)</option>
                  <option value="CLARIFICATION_REQUIRED">CLARIFICATION REQUIRED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Departmental Review Remarks</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Record justification, strengths, or interview remarks..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="conflict"
                  checked={conflictConfirmed}
                  onChange={(e) => setConflictConfirmed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="conflict" className="text-xs text-slate-700 select-none">
                  I confirm that I have no personal conflict of interest in evaluating this candidate.
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {submitting ? "Submitting..." : "Submit Department Evaluation"}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="text-center py-8 text-xs text-slate-500">
          No rubric configured for this programme.
        </Card>
      )}
    </div>
  );
};
