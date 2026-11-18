import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { Files, CheckCircle2, Clock, ArrowRight } from "lucide-react";

export const EvaluatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.get("/dashboard/evaluator");
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="text-center py-12 text-xs text-slate-400">Loading evaluator portal...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Faculty Evaluator Portal</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
          Conduct Stage 4 Departmental Reviews. Grade applicant credentials against degree rubrics and record recommendations.
        </p>

        <div className="mt-5">
          <Link
            to="/evaluator/assignments"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Files className="w-4 h-4" /> View Evaluation Queue ({stats?.pendingAssignments || 0})
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.pendingAssignments || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Pending Department Reviews</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats?.completedAssignments || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Evaluations</div>
          </div>
        </Card>
      </div>

      <Card title="Assigned Application Queue" subtitle="Departmental merit review assignments">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Programme</th>
                <th className="py-2.5 px-3">Assignment Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentAssignments?.map((a: any) => (
                <tr key={a.assignment_id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-blue-700">{a.application_reference}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{a.applicant_name}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-700">{a.programme_code}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={getStatusBadgeVariant(a.assignment_status)} size="sm">
                      {a.assignment_status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/evaluator/rubric/${a.application_id}`}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold inline-flex items-center gap-1"
                    >
                      Score Rubric <ArrowRight className="w-3 h-3" />
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
