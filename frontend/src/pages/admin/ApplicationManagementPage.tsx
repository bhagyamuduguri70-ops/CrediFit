import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  Files,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from "lucide-react";

export const ApplicationManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [applications, setApplications] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [stageFilter, setStageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [programmeFilter, setProgrammeFilter] = useState("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, progRes] = await Promise.all([
        api.get("/applications?limit=100"),
        api.get("/courses/programmes"),
      ]);
      setApplications(appsRes.data.data || []);
      setProgrammes(progRes.data.data || []);
    } catch (err) {
      console.error("Failed to load application register:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter application list
  const filtered = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.application_reference?.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(search.toLowerCase()) ||
      app.programme_code?.toLowerCase().includes(search.toLowerCase());

    const matchesStage =
      stageFilter === "ALL" || String(app.current_stage_id) === stageFilter;

    const matchesStatus =
      statusFilter === "ALL" || app.application_status === statusFilter;

    const matchesProgramme =
      programmeFilter === "ALL" || String(app.programme_id) === programmeFilter;

    return matchesSearch && matchesStage && matchesStatus && matchesProgramme;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getStageName = (stageId: number) => {
    switch (stageId) {
      case 1:
        return "1. Application";
      case 2:
        return "2. Documents";
      case 3:
        return "3. Eligibility";
      case 4:
        return "4. Evaluation";
      case 5:
        return "5. Admission";
      default:
        return `Stage ${stageId}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Applications Register
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Stage-wise tracking, filtering, and inspection of all university admission submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs">
            {filtered.length} Applications Match
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ref, student, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ALL">All Screening Stages</option>
            <option value="1">Stage 1: Application Screening</option>
            <option value="2">Stage 2: Document Verification</option>
            <option value="3">Stage 3: Eligibility Screening</option>
            <option value="4">Stage 4: Department Evaluation</option>
            <option value="5">Stage 5: Final Admission Decision</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ALL">All Application Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="DRAFT">Draft</option>
          </select>

          {/* Programme Filter */}
          <select
            value={programmeFilter}
            onChange={(e) => {
              setProgrammeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ALL">All Degree Courses</option>
            {programmes.map((p) => (
              <option key={p.programme_id} value={String(p.programme_id)}>
                {p.programme_code} - {p.programme_name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>App Reference</th>
                <th>Applicant Name</th>
                <th>Course / Degree</th>
                <th>Screening Stage</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                    Loading applications from database...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-xs text-slate-400">
                    No applications found matching query.
                  </td>
                </tr>
              ) : (
                paginated.map((app) => (
                  <tr key={app.application_id}>
                    <td>
                      <div className="font-mono text-xs font-bold text-[#142B4F]">
                        {app.application_reference}
                      </div>
                      <div className="text-[10px] text-slate-400">ID #{app.application_id}</div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-900">{app.applicant_name}</div>
                      <div className="text-[11px] text-slate-500">{app.applicant_email}</div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {app.programme_code}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                        {app.programme_name}
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {getStageName(app.current_stage_id || 1)}
                      </span>
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(app.application_status)} dot>
                        {app.application_status}
                      </Badge>
                    </td>
                    <td className="text-xs text-slate-500">
                      {app.submitted_at
                        ? new Date(app.submitted_at).toLocaleDateString()
                        : new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/officer/applications/${app.application_id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-md transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold">{page}</span> of{" "}
              <span className="font-bold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
