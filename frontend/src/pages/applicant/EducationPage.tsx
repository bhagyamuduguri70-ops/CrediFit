import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { EducationRecord } from "../../types";
import { GraduationCap, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react";

export const EducationPage: React.FC = () => {
  const [records, setRecords] = useState<EducationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState({
    qualification: "12TH",
    institution: "",
    board: "",
    yearOfPassing: new Date().getFullYear(),
    marksObtained: "",
    maximumMarks: "500",
  });

  const loadRecords = async () => {
    try {
      const res = await api.get("/applicants/education");
      setRecords(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await api.post("/applicants/education", form);
      setMessage({ type: "success", text: "Education record added successfully." });
      setForm({
        qualification: "12TH",
        institution: "",
        board: "",
        yearOfPassing: new Date().getFullYear(),
        marksObtained: "",
        maximumMarks: "500",
      });
      loadRecords();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to add record." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this educational record?")) return;
    try {
      await api.delete(`/applicants/education/${id}`);
      setMessage({ type: "success", text: "Education record removed." });
      loadRecords();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Delete failed." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Academic Qualifications</h1>
        <p className="text-xs text-slate-500 mt-1">
          Record your prior examination marks. The system automatically computes your aggregate percentage for rule-based eligibility evaluation.
        </p>
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

      {/* Existing records table */}
      <Card title="Submitted Qualification History">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-400">Loading records...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No education records added yet. Please use the form below to add your 10th/12th marks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Qualification</th>
                  <th className="py-2.5 px-3">Board / University</th>
                  <th className="py-2.5 px-3">Institution</th>
                  <th className="py-2.5 px-3">Passing Year</th>
                  <th className="py-2.5 px-3">Marks</th>
                  <th className="py-2.5 px-3 text-right">Aggregate %</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r.education_record_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{r.qualification}</td>
                    <td className="py-2.5 px-3 text-slate-700">{r.board}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.institution}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.year_of_passing}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {r.marks_obtained} / {r.maximum_marks}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {Number(r.percentage).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDelete(r.education_record_id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add new record form */}
      <Card title="Add Qualification Details" subtitle="Enter your marks card information">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification Level</label>
              <select
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="10TH">10th Standard (SSLC / Matric)</option>
                <option value="12TH">12th Standard (PUC / HSC)</option>
                <option value="DIPLOMA">Diploma</option>
                <option value="GRADUATION">Undergraduate Degree</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Board / Council</label>
              <input
                type="text"
                name="board"
                value={form.board}
                onChange={handleChange}
                required
                placeholder="e.g. CBSE, Karnataka State Board"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">School / College Name</label>
              <input
                type="text"
                name="institution"
                value={form.institution}
                onChange={handleChange}
                required
                placeholder="Name of Institution"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Year of Passing</label>
              <input
                type="number"
                name="yearOfPassing"
                value={form.yearOfPassing}
                onChange={handleChange}
                min={1990}
                max={2030}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Marks Obtained</label>
              <input
                type="number"
                step="0.01"
                name="marksObtained"
                value={form.marksObtained}
                onChange={handleChange}
                required
                placeholder="e.g. 420"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Maximum Marks</label>
              <input
                type="number"
                step="0.01"
                name="maximumMarks"
                value={form.maximumMarks}
                onChange={handleChange}
                required
                placeholder="e.g. 500"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {submitting ? "Saving..." : "Add Qualification Record"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
