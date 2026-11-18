import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { API_BASE_URL } from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { FileCheck2, ArrowRight, Eye, CheckCircle2 } from "lucide-react";

export const DocumentVerificationPage: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQueue() {
      try {
        const res = await api.get("/applications?stageId=2");
        setApplications(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Document Verification Queue (Stage 2)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Applications pending candidate document inspection and authenticity checks.
        </p>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading queue...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            Verification queue is clear! No applications pending stage 2 document review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Programme</th>
                  <th className="py-2.5 px-3">Academic Cycle</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{app.application_reference}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{app.applicant_name}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{app.programme_code}</td>
                    <td className="py-2.5 px-3 text-slate-600">{app.cycle_name}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={getStatusBadgeVariant(app.application_status)} size="sm">
                        {app.application_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/officer/applications/${app.application_id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                      >
                        Verify Documents <ArrowRight className="w-3 h-3" />
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
