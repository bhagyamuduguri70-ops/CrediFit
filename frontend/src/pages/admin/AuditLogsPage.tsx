import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { ScrollText, Search, RefreshCw } from "lucide-react";

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSearch, setActionSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/audit-logs?action=${encodeURIComponent(actionSearch)}`);
      setLogs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">System Audit Register</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete tamper-evident log of user actions, document reviews, stage transitions, and admission decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action name..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => loadLogs()}
            title="Refresh logs"
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">No audit log entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Log #</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Entity ID</th>
                  <th className="py-2.5 px-3">Performed By</th>
                  <th className="py-2.5 px-3">Client IP</th>
                  <th className="py-2.5 px-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.audit_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">#{log.audit_id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-600">{log.entity_name}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{log.entity_id || "-"}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-blue-700">{log.user_name || "System"}</div>
                      {log.user_email && <div className="text-[10px] text-slate-400">{log.user_email}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.ip_address || "::1"}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
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
