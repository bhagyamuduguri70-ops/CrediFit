import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  Layers,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  Award,
  CheckSquare,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  UserCheck,
} from "lucide-react";

const STAGES = [
  {
    id: 1,
    name: "Stage 1: Application Screening",
    shortName: "Application",
    desc: "Online applicant profile submission, degree selection, and qualifying percentage entry.",
    role: "Applicant / Admissions",
  },
  {
    id: 2,
    name: "Stage 2: Document Verification",
    shortName: "Documents",
    desc: "Admission officer audit of mark sheets, photo ID, transfer certificate, and category proofs.",
    role: "Admission Officer",
  },
  {
    id: 3,
    name: "Stage 3: Eligibility Screening",
    shortName: "Eligibility",
    desc: "Automated & officer-reviewed cutoff evaluation against category eligibility rules.",
    role: "Eligibility Engine / Officer",
  },
  {
    id: 4,
    name: "Stage 4: Department Merit Review",
    shortName: "Evaluation",
    desc: "Faculty evaluation across rubric criteria (Aptitude, Academics, Statement).",
    role: "Department Evaluators",
  },
  {
    id: 5,
    name: "Stage 5: Admission Confirmation",
    shortName: "Admission",
    desc: "Formal recording of final admission status: ADMITTED, NOT ADMITTED, or WAITLISTED.",
    role: "Administrator",
  },
];

export const StageScreeningHubPage: React.FC = () => {
  const [activeStage, setActiveStage] = useState(1);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadStageApplications = async (stageId: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/applications?stageId=${stageId}&limit=50`);
      setApplications(res.data.data || []);
    } catch (err) {
      console.error(err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStageApplications(activeStage);
  }, [activeStage]);

  const filtered = applications.filter(
    (app) =>
      !search ||
      app.application_reference?.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.programme_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
          Stage-Wise Screening Workflow Register
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Canonical 5-stage verification protocol enforcing sequential progression from submission to final admission.
        </p>
      </div>

      {/* Modern Stage Stepper Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAGES.map((stg) => {
          const isActive = activeStage === stg.id;
          return (
            <button
              key={stg.id}
              type="button"
              onClick={() => setActiveStage(stg.id)}
              className={`p-4 rounded-xl text-left transition-all duration-200 border cursor-pointer ${
                isActive
                  ? "bg-[#142B4F] text-white border-[#142B4F] shadow-md ring-2 ring-blue-400/30"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                    isActive ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {stg.id}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? "bg-white/10 text-teal-300" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Stage {stg.id}
                </span>
              </div>
              <div className={`text-xs font-bold leading-tight ${isActive ? "text-white" : "text-slate-900"}`}>
                {stg.shortName}
              </div>
              <div
                className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                  isActive ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {stg.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detail Banner */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-[#142B4F] flex items-center gap-2">
            <span>{STAGES[activeStage - 1].name}</span>
            <span className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              Auditor: {STAGES[activeStage - 1].role}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{STAGES[activeStage - 1].desc}</p>
        </div>

        {/* Action shortcut depending on stage */}
        <div className="shrink-0 flex items-center gap-2">
          {activeStage === 2 && (
            <Link
              to="/admin/documents"
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Document Verification Hub</span>
            </Link>
          )}
          {activeStage === 4 && (
            <Link
              to="/admin/merit-list"
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Merit Ranking List</span>
            </Link>
          )}
          {activeStage === 5 && (
            <Link
              to="/admin/decisions"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Admission Confirmation Console</span>
            </Link>
          )}
        </div>
      </div>

      {/* Candidates at this stage */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>Active Candidates in {STAGES[activeStage - 1].shortName}</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {filtered.length} In Queue
            </span>
          </div>
        }
      >
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, student name, course..."
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
                <th>Course</th>
                <th>Current Status</th>
                <th>Stage Evaluation</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    Querying stage register from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    No candidates currently waiting at Stage {activeStage}.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.application_id}>
                    <td className="font-mono text-xs font-bold text-[#142B4F]">
                      {app.application_reference}
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{app.applicant_name}</div>
                      <div className="text-[11px] text-slate-400">{app.applicant_email}</div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {app.programme_code}
                      </span>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(app.application_status)} dot>
                        {app.application_status}
                      </Badge>
                    </td>
                    <td>
                      {app.final_decision ? (
                        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {app.final_decision}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                          IN PROGRESS
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/officer/applications/${app.application_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Advance</span>
                      </Link>
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
