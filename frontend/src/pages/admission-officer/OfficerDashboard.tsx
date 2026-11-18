import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  FileCheck2,
  Users,
  GraduationCap,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const OfficerDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/dashboard/officer");
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs text-slate-400">Loading officer portal...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admission Officer Portal</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
          Screen admission registrations, verify submitted marksheets, execute rule-based eligibility checks, and request document clarifications.
        </p>

        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            to="/officer/documents"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileCheck2 className="w-4 h-4" /> Pending Verification Queue ({stats?.pendingDocumentsCount || 0})
          </Link>
          <Link
            to="/officer/applications"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4" /> Applications Register
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.pendingDocumentsCount || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Documents Pending Review</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.pendingDocumentVerificationApps || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Stage 2: Document Verification</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.pendingEligibilityScreeningApps || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Stage 3: Eligibility Screening</div>
          </div>
        </Card>
      </div>

      {/* Recent submissions table */}
      <Card title="Recent Application Submissions" subtitle="Stage-wise admission processing queue">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Programme</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Submission Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentSubmissions?.map((app: any) => (
                <tr key={app.application_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{app.application_reference}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{app.applicant_name}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-bold">{app.programme_code}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={getStatusBadgeVariant(app.application_status)} size="sm">
                      {app.application_status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : "Draft"}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/officer/applications/${app.application_id}`}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      Screen <ArrowRight className="w-3 h-3" />
                    </Link>
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
