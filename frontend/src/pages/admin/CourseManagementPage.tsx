import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  BookOpen,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Users,
  Search,
  X,
  Building,
} from "lucide-react";

export const CourseManagementPage: React.FC = () => {
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
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
    setLoading(true);
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
      setMessage({ type: "success", text: "Degree programme added to catalog successfully." });
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

  const filtered = programmes.filter(
    (p) =>
      p.programme_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.programme_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Course & Programme Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure degree courses, admission eligibility criteria, seat quotas, and department affiliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdd(true)}
            className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Degree Course
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search course by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            Loading course catalog from MySQL...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            No courses found matching your search.
          </div>
        ) : (
          filtered.map((prog) => (
            <div
              key={prog.programme_id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 text-xs font-bold bg-[#142B4F] text-white rounded-md tracking-wider">
                    {prog.programme_code}
                  </span>
                  <Badge variant={prog.programme_status === "ACTIVE" ? "success" : "neutral"} dot>
                    {prog.programme_status || "ACTIVE"}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {prog.programme_name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {prog.description || "Undergraduate degree programme offering rigorous academic and practical training."}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prog.duration_years || 3} Years Duration</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>Min {prog.qualification_required || "10+2 / 12TH"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>{prog.department_name || "Faculty of Computing"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>General & Quota Seats</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">ID #{prog.programme_id}</span>
                <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/80">
                  Cutoff: 50% Min
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md animate-fade-in overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Degree Course</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA, BSC-CS, BTECH-AI"
                  value={newProg.programmeCode}
                  onChange={(e) => setNewProg({ ...newProg, programmeCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course / Programme Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bachelor of Computer Applications"
                  value={newProg.programmeName}
                  onChange={(e) => setNewProg({ ...newProg, programmeName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={newProg.durationYears}
                    onChange={(e) => setNewProg({ ...newProg, durationYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Minimum Qualification</label>
                  <select
                    value={newProg.qualificationRequired}
                    onChange={(e) => setNewProg({ ...newProg, qualificationRequired: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="12TH">10+2 / Intermediate</option>
                    <option value="10TH">10th / Secondary</option>
                    <option value="DIPLOMA">Polytechnic Diploma</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Overview of curriculum and learning outcomes..."
                  value={newProg.description}
                  onChange={(e) => setNewProg({ ...newProg, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Add Programme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
