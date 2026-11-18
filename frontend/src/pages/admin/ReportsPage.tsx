import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Users,
  Files,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  FileCheck2,
  PieChart,
} from "lucide-react";

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/reports");
      setReports(res.data.data);
    } catch (err) {
      console.error("Failed to load admission reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !reports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin mb-3" />
        <span className="text-xs font-semibold text-slate-600">Generating university admission report...</span>
      </div>
    );
  }

  const summary = reports?.summary || {};
  const programmes = reports?.programmes || [];
  const funnel = reports?.funnel || [];
  const docs = reports?.documents || {};
  const categories = reports?.categories || [];

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Admission Reports & Analytics
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit-grade performance metrics, conversion funnels, degree quotas, and verification health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Applications
          </span>
          <div className="text-2xl font-bold text-[#172033] mt-1">{summary.total_applications || 0}</div>
          <span className="text-[11px] text-teal-700 font-medium">{summary.total_applicants || 0} Unique Students</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Admitted Students
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.admitted_count || 0}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Offers Confirmed</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pending Screening
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{summary.in_progress_count || 0}</div>
          <span className="text-[11px] text-amber-700 font-medium">Active in Pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Documents Verified
          </span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{docs.verified_docs || 0}</div>
          <span className="text-[11px] text-slate-500 font-medium">{docs.total_documents || 0} Total Uploads</span>
        </div>
      </div>

      {/* Programme Breakdown Table */}
      <Card
        title="Degree Programme Performance & Conversion"
        subtitle="Applications, average qualifying percentages, and confirmed offers by course"
      >
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Applications</th>
                <th>Avg Qualifying %</th>
                <th>Admitted</th>
                <th>Offer Rate</th>
              </tr>
            </thead>
            <tbody>
              {programmes.map((p: any) => {
                const total = p.applications_count || 0;
                const admitted = p.admitted_count || 0;
                const rate = total > 0 ? Math.round((admitted / total) * 100) : 0;

                return (
                  <tr key={p.programme_id}>
                    <td>
                      <span className="px-2 py-0.5 text-xs font-bold bg-[#142B4F] text-white rounded">
                        {p.programme_code}
                      </span>
                    </td>
                    <td className="font-semibold text-slate-900">{p.programme_name}</td>
                    <td className="font-semibold text-slate-800">{total}</td>
                    <td className="text-slate-700 font-medium">{p.avg_percentage || 0}%</td>
                    <td className="font-bold text-emerald-600">{admitted}</td>
                    <td>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Funnel & Social Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage-wise Funnel */}
        <Card
          title="Admission Screening Funnel"
          subtitle="Candidate progression through each sequential stage"
        >
          <div className="space-y-4 pt-1">
            {funnel.map((fn: any) => {
              const totalApps = summary.total_applications || 1;
              const reached = fn.reached_or_passed || 0;
              const pct = Math.round((reached / totalApps) * 100);

              return (
                <div key={fn.stage_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      Stage {fn.stage_order}: {fn.stage_name}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {reached} candidates ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2563EB] to-teal-500 rounded-full"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Social Category Reservation Quotas */}
        <Card
          title="Social Category Representation"
          subtitle="Distribution of applications and admissions across reservation quotas"
        >
          <div className="cf-table-container">
            <table className="cf-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Applicants</th>
                  <th>Admitted</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: any) => {
                  const total = summary.total_applications || 1;
                  const catTotal = cat.total_applications || 0;
                  const share = Math.round((catTotal / total) * 100);

                  return (
                    <tr key={cat.category}>
                      <td className="font-bold text-slate-900">{cat.category}</td>
                      <td>{catTotal}</td>
                      <td className="text-emerald-600 font-semibold">{cat.admitted_count || 0}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{share}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${share}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
