import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { Calendar, Plus, CheckCircle, AlertCircle } from "lucide-react";

export const AdmissionCyclePage: React.FC = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCycle, setNewCycle] = useState({
    cycleName: "",
    academicYear: "2026-2027",
    startDate: "2026-06-01",
    endDate: "2027-03-31",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCycles = async () => {
    try {
      const res = await api.get("/courses/cycles");
      setCycles(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await api.post("/courses/cycles", newCycle);
      setMessage({ type: "success", text: "Admission cycle created." });
      setShowAdd(false);
      loadCycles();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create cycle." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Admission Cycles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure active admission terms, enrollment windows, and academic year schedules.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Admission Cycle
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {showAdd && (
        <Card title="Add Admission Cycle" subtitle="Configure enrollment dates">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cycle Title</label>
                <input
                  type="text"
                  required
                  placeholder="CrediFit Admission Cycle 2026-2027"
                  value={newCycle.cycleName}
                  onChange={(e) => setNewCycle({ ...newCycle, cycleName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="2026-2027"
                  value={newCycle.academicYear}
                  onChange={(e) => setNewCycle({ ...newCycle, academicYear: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={newCycle.startDate}
                  onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={newCycle.endDate}
                  onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Create Cycle"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading cycles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Cycle Title</th>
                  <th className="py-2.5 px-3">Academic Year</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">End Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((c) => (
                  <tr key={c.cycle_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{c.cycle_name}</td>
                    <td className="py-2.5 px-3 text-blue-700 font-bold">{c.academic_year}</td>
                    <td className="py-2.5 px-3 text-slate-600">{new Date(c.start_date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-slate-600">{new Date(c.end_date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={getStatusBadgeVariant(c.cycle_status)} size="sm">
                        {c.cycle_status}
                      </Badge>
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
