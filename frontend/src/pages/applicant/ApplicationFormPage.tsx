import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Programme, AdmissionCycle } from "../../types";
import { FileText, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export const ApplicationFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedProgId = searchParams.get("programmeId");

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [cycles, setCycles] = useState<AdmissionCycle[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState(preselectedProgId || "");
  const [selectedCycle, setSelectedCycle] = useState("");
  const [qualification, setQualification] = useState("12TH");
  const [personalStatement, setPersonalStatement] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function loadMeta() {
      try {
        const [progRes, cycleRes] = await Promise.all([
          api.get("/courses/programmes"),
          api.get("/courses/cycles"),
        ]);
        setProgrammes(progRes.data.data || []);
        const cyc = cycleRes.data.data || [];
        setCycles(cyc);
        if (cyc.length > 0) setSelectedCycle(String(cyc[0].cycle_id));
        if (preselectedProgId) setSelectedProgramme(preselectedProgId);
      } catch (err) {
        console.error("Error loading application metadata:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [preselectedProgId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await api.post("/applications", {
        programmeId: Number(selectedProgramme),
        cycleId: selectedCycle ? Number(selectedCycle) : undefined,
        qualification,
        personalStatement,
      });

      const appId = res.data.data.applicationId;
      navigate(`/applicant/applications?highlight=${appId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create application draft.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-slate-400">Loading form...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">New Admission Application</h1>
        <p className="text-xs text-slate-500 mt-1">
          Select your target degree programme and provide your academic statement to initiate the stage-wise register.
        </p>
      </div>

      <Card>
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Degree Programme</label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a programme</option>
              {programmes.map((p) => (
                <option key={p.programme_id} value={p.programme_id}>
                  {p.programme_code} - {p.programme_name} ({p.duration_years} Years)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Admission Cycle</label>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cycles.map((c) => (
                <option key={c.cycle_id} value={c.cycle_id}>
                  {c.cycle_name} ({c.academic_year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifying Examination</label>
            <select
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="12TH">12th Standard / Pre-University Certificate (PUC)</option>
              <option value="10TH">10th Standard (Secondary School)</option>
              <option value="DIPLOMA">Polytechnic Diploma</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personal Statement & Statement of Purpose
            </label>
            <textarea
              rows={4}
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
              placeholder="State your reasons for choosing this programme and your career goals..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Application will be initialized in <strong>Stage 1 (Submission)</strong>.
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Save Application Draft"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
