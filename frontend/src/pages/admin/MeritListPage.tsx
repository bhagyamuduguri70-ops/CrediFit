import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  Award,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";

export const MeritListPage: React.FC = () => {
  const [meritList, setMeritList] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meritRes, progRes] = await Promise.all([
        api.get("/admission/merit-list"),
        api.get("/courses/programmes"),
      ]);
      setMeritList(meritRes.data.data || []);
      setProgrammes(progRes.data.data || []);
    } catch (err) {
      console.error("Failed to load merit list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = meritList.filter((m) => {
    const matchesProg =
      selectedProgramme === "ALL" || String(m.programme_id) === selectedProgramme;

    const matchesSearch =
      !search ||
      m.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.application_reference?.toLowerCase().includes(search.toLowerCase()) ||
      m.programme_code?.toLowerCase().includes(search.toLowerCase());

    return matchesProg && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Merit Screening & Rank Register
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Stage 4 & 5 merit ranking: Composite scores computed from 10+2 marks (60%) and faculty rubric reviews (40%).
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Recalculate Merit</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate name, ref #, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="ALL">All Degree Programmes</option>
              {programmes.map((p) => (
                <option key={p.programme_id} value={String(p.programme_id)}>
                  {p.programme_code} - {p.programme_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Merit Ranking Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Merit Standings</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {filtered.length} Ranked Candidates
            </span>
          </div>
        }
      >
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th className="w-16 text-center">Rank</th>
                <th>Candidate / Application</th>
                <th>Degree Course</th>
                <th>Category</th>
                <th>Academic % (60%)</th>
                <th>Evaluation (40%)</th>
                <th>Composite Merit</th>
                <th>Admission Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-xs text-slate-400">
                    Computing real-time merit standings from MySQL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-xs text-slate-400">
                    No candidates found for selected degree programme.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr key={item.application_id}>
                      <td className="text-center">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                              : idx === 1
                              ? "bg-slate-200 text-slate-800 ring-2 ring-slate-300"
                              : idx === 2
                              ? "bg-amber-700/20 text-amber-900 ring-2 ring-amber-600/30"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-900">{item.applicant_name}</div>
                        <div className="font-mono text-[10px] text-blue-700">
                          {item.application_reference}
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.programme_code}
                        </span>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 rounded text-slate-700">
                          {item.category || "GENERAL"}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-800">
                        {item.academic_percentage ? `${item.academic_percentage}%` : "Pending"}
                      </td>
                      <td className="font-semibold text-slate-800">
                        {item.evaluation_score ? `${item.evaluation_score} pts` : "Pending"}
                      </td>
                      <td>
                        <div className="text-sm font-bold text-[#142B4F]">
                          {item.composite_merit_score || 0}
                        </div>
                        <div className="text-[10px] text-teal-600 font-medium">Ranked Score</div>
                      </td>
                      <td>
                        {item.final_decision ? (
                          <Badge variant={getStatusBadgeVariant(item.final_decision)} dot>
                            {item.final_decision}
                          </Badge>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Screening
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/officer/applications/${item.application_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
