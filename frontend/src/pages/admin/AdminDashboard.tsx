import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  Users,
  Files,
  FileCheck2,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  Filter,
  BarChart3,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const navigate = useNavigate();

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/admin");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold text-slate-600">Loading university admission register...</span>
      </div>
    );
  }

  // Filter recent applications
  const recentApps = stats?.recentApplications || [];
  const filteredApps = recentApps.filter((app: any) => {
    const matchesSearch =
      !tableSearch ||
      app.application_reference?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      app.applicant_name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      app.programme_code?.toLowerCase().includes(tableSearch.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || app.application_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Welcome Header */}
      <div className="bg-[#142B4F] text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#2563EB]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              University Admission Register Active
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Executive Admission Management Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring across all 5 screening stages: Application Screening, Document Verification, Eligibility Rules, Merit Evaluation, and Final Enrollment.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              to="/admin/decisions"
              className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Stage 5 Decisions
            </Link>
            <Link
              to="/admin/merit-list"
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Award className="w-4 h-4" /> Merit Ranking
            </Link>
            <button
              onClick={loadStats}
              title="Refresh Data"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Professional KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Applicants */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Applicants
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#172033] mt-1">
              {stats?.totalApplicants || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-teal-700 font-medium mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>Registered Accounts</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Applications */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Applications
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#172033] mt-1">
              {stats?.totalApplications || 0}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1">
              Active Admission Cycle
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Files className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Pending Verification
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
              {stats?.pendingCount || 0}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Stage 2 & 3 in progress
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Confirmed Admissions */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-all flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Confirmed Admissions
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">
              {stats?.admittedCount || 0}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              Enrolled Candidates
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Analytics Section: 5-Stage Funnel & Degree Programmes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Stage-wise Screening Pipeline (7 cols) */}
        <div className="lg:col-span-7">
          <Card
            title="Stage-Wise Screening Distribution"
            subtitle="Real candidate counts currently at each verification checkpoint"
            action={
              <Link
                to="/admin/screening"
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>Screening Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3.5 pt-1">
              {stats?.stageDistribution?.map((stg: any) => {
                const total = stats?.totalApplications || 1;
                const percentage = Math.round(((stg.total || 0) / total) * 100);

                return (
                  <div key={stg.stage_order} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[#142B4F] text-white font-bold flex items-center justify-center text-[10px]">
                          {stg.stage_order}
                        </span>
                        <span className="font-semibold text-slate-900">{stg.stage_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{stg.total} candidates</span>
                        <span className="text-[11px] text-slate-400">({percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Degree Programme Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          <Card
            title="Programme Applications"
            subtitle="Degree-wise enrollment demand"
            action={
              <Link
                to="/admin/courses"
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-3 pt-1">
              {stats?.programmeDistribution?.map((p: any) => (
                <div
                  key={p.programme_code}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#142B4F] text-white rounded">
                        {p.programme_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-900">{p.programme_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">3-Year Undergraduate</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block">
                      {p.applications_count}
                    </span>
                    <span className="text-[10px] text-slate-400">applied</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Applications Data Table */}
      <Card
        title="Recent Applications Register"
        subtitle="Latest submissions recorded in MySQL with live stage status"
        action={
          <Link
            to="/admin/applications"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>Full Register</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {/* Table Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, student name, or course..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
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
              <option value="ALL">All Application Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>

        {/* Table container */}
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>App Reference</th>
                <th>Applicant Name</th>
                <th>Programme</th>
                <th>Submission Date</th>
                <th>Application Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No recent applications matching current filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app: any) => (
                  <tr key={app.application_id}>
                    <td className="font-mono text-xs font-semibold text-[#142B4F]">
                      {app.application_reference}
                    </td>
                    <td className="font-medium text-slate-900">{app.applicant_name}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                        {app.programme_code}
                      </span>
                    </td>
                    <td className="text-slate-500 text-xs">
                      {new Date(app.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(app.application_status)} dot>
                        {app.application_status}
                      </Badge>
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
      </Card>

      {/* Recent System Audit Logs Preview */}
      <Card
        title="Live System Audit Trail"
        subtitle="Immutable security trail of administrative actions and stage transitions"
        action={
          <Link
            to="/admin/audit-logs"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>Full Logs</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Action Performed</th>
                <th>Entity Target</th>
                <th>Operator</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentAuditLogs?.slice(0, 6).map((log: any) => (
                <tr key={log.audit_id}>
                  <td className="font-mono text-[11px] text-slate-400">#{log.audit_id}</td>
                  <td className="font-semibold text-slate-800">{log.action}</td>
                  <td className="text-slate-600">
                    {log.entity_name} {log.entity_id ? `(#${log.entity_id})` : ""}
                  </td>
                  <td className="text-teal-700 font-medium">{log.user_name || "System Automated"}</td>
                  <td className="text-slate-500 text-xs">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
