import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { BookOpen, Plus, CheckCircle, AlertCircle } from "lucide-react";

export const ProgrammeManagementPage: React.FC = () => {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProg, setNewProg] = useState({
    programmeCode: "",
    programmeName: "",
    durationYears: 3,
    qualificationRequired: "12TH",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProgrammes = async () => {
    try {
      const res = await api.get("/courses/programmes");
      setProgrammes(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgrammes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await api.post("/courses/programmes", newProg);
      setMessage({ type: "success", text: "Degree programme added to catalog." });
      setShowAdd(false);
      setNewProg({
        programmeCode: "",
        programmeName: "",
        durationYears: 3,
        qualificationRequired: "12TH",
        description: "",
      });
      loadProgrammes();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create programme." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Degree Programme Administration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage academic offerings (BCA, BBA, BCOM) and admission availability.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Degree Programme
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
        <Card title="Add Degree Programme" subtitle="Create approved degree catalog entry">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Programme Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA, BBA"
                  value={newProg.programmeCode}
                  onChange={(e) => setNewProg({ ...newProg, programmeCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Degree Title</label>
                <input
                  type="text"
                  required
                  placeholder="Bachelor of Computer Applications"
                  value={newProg.programmeName}
                  onChange={(e) => setNewProg({ ...newProg, programmeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newProg.durationYears}
                  onChange={(e) => setNewProg({ ...newProg, durationYears: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newProg.description}
                onChange={(e) => setNewProg({ ...newProg, description: e.target.value })}
                placeholder="Overview of syllabus, electives, and requirements..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                {submitting ? "Saving..." : "Save Programme"}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading programmes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Programme Title</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Entry Criteria</th>
                  <th className="py-2.5 px-3">Catalog Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programmes.map((p) => (
                  <tr key={p.programme_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-bold text-blue-700">{p.programme_code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{p.programme_name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.duration_years} Years</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.qualification_required}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={getStatusBadgeVariant(p.programme_status)} size="sm">
                        {p.programme_status}
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
