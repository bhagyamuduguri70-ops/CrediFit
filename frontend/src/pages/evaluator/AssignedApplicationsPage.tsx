import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { Files, ArrowRight, CheckCircle2 } from "lucide-react";

export const AssignedApplicationsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssignments() {
      try {
        const res = await api.get("/screening/evaluator/assignments");
        setAssignments(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assigned Departmental Evaluations</h1>
        <p className="text-xs text-slate-500 mt-1">
          Applications assigned to you for academic evaluation, scoring, and recommendation.
        </p>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No applications currently assigned for evaluation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Candidate Name</th>
                  <th className="py-2.5 px-3">Degree Programme</th>
                  <th className="py-2.5 px-3">Assigned Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Evaluation Sheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.assignment_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{a.application_reference}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{a.applicant_name}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{a.programme_code}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(a.assigned_at).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={getStatusBadgeVariant(a.assignment_status)} size="sm">
                        {a.assignment_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/evaluator/rubric/${a.application_id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                      >
                        {a.assignment_status === "COMPLETED" ? "Review Sheet" : "Grade Rubric"} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
