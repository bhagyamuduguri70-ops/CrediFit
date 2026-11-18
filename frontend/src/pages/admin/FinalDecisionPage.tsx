import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  CheckCircle2,
  X,
  Search,
  Filter,
  RefreshCw,
  Award,
} from "lucide-react";

export const FinalDecisionPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Decision modal / selection
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [decision, setDecision] = useState("ADMITTED");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications?stageId=5");
      const list = res.data.data || [];

      const res4 = await api.get("/applications?stageId=4");
      const all = [...list, ...(res4.data.data || [])];

      const unique = Array.from(new Map(all.map((item) => [item.application_id, item])).values());
      setApplications(unique);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await api.post(`/admission/${selectedApp.application_id}/decision`, {
        decision,
        remarks,
      });

      setMessage({
        type: "success",
        text: `Formal admission decision '${decision}' recorded successfully for ${selectedApp.applicant_name}.`,
      });
      setSelectedApp(null);
      setRemarks("");
      loadApplications();
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to record decision.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = applications.filter(
    (a) =>
      !search ||
      a.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.application_reference?.toLowerCase().includes(search.toLowerCase()) ||
      a.programme_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Stage 5: Admission Confirmation Register
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Final stage authority: Record formal admission, issue provisional offers, or register waitlisted seats.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Candidates</span>
        </button>
      </div>

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

      {/* Decision Recording Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Admission Offer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Candidate: {selectedApp.applicant_name} ({selectedApp.application_reference})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordDecision} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Degree Course:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedApp.programme_code} - {selectedApp.programme_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Screening Stage:</span>
                  <span className="font-semibold text-blue-700">
                    Stage {selectedApp.stage_order || 5}: {selectedApp.stage_name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Admission Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision("ADMITTED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      decision === "ADMITTED"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    ADMITTED
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("WAITLISTED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      decision === "WAITLISTED"
                        ? "bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    WAITLISTED
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision("NOT_ADMITTED")}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                      decision === "NOT_ADMITTED"
                        ? "bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    NOT ADMITTED
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Remarks / Enrollment Note *
                </label>
                <textarea
                  required
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Approved on merit based on 10+2 marks and departmental evaluation recommendation."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Committing Transaction..." : "Confirm Final Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Candidates Ready for Final Admission Decision</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {filtered.length} In Register
            </span>
          </div>
        }
      >
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, ref #, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
          </div>
        </div>

        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>App Reference</th>
                <th>Candidate Name</th>
                <th>Degree Course</th>
                <th>Screening Stage</th>
                <th>Lifecycle Status</th>
                <th>Recorded Decision</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                    Loading candidates awaiting Stage 5 decisions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                    No candidates awaiting Stage 5 admission decision.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.application_id}>
                    <td className="font-mono text-xs font-bold text-[#142B4F]">
                      {a.application_reference}
                    </td>
                    <td className="font-semibold text-slate-900">{a.applicant_name}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {a.programme_code}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-slate-700">
                        Stage {a.stage_order}: {a.stage_name}
                      </span>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(a.application_status)} dot>
                        {a.application_status}
                      </Badge>
                    </td>
                    <td>
                      {a.final_decision ? (
                        <Badge variant={getStatusBadgeVariant(a.final_decision)} dot>
                          {a.final_decision}
                        </Badge>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          Awaiting Decision
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApp(a);
                          setDecision(a.final_decision || "ADMITTED");
                          setRemarks(`Admission decision recorded for ${a.programme_name}.`);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        Award Offer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
