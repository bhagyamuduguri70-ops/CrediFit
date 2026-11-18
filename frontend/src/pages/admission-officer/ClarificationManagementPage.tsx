import React, { useState } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export const ClarificationManagementPage: React.FC = () => {
  const [appId, setAppId] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      await api.post("/clarifications", {
        applicationId: Number(appId),
        clarificationType: type,
        requestMessage: message,
      });
      setFeedback({ type: "success", text: "Clarification request submitted to candidate." });
      setAppId("");
      setMessage("");
    } catch (err: any) {
      setFeedback({ type: "error", text: err.response?.data?.message || "Failed to submit request." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Request Candidate Clarification</h1>
        <p className="text-xs text-slate-500 mt-1">
          Issue inquiries regarding illegible marksheets, mismatched percentages, or pending eligibility information.
        </p>
      </div>

      <Card>
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Application ID</label>
            <input
              type="number"
              required
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="e.g. 1"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Query Category</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DOCUMENT">Document Clarity / Marks Card Re-upload</option>
              <option value="ELIGIBILITY">Eligibility Calculation Query</option>
              <option value="GENERAL">General Admission Inquiry</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Details for Applicant</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain what information or updated document is required from the candidate..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> {loading ? "Sending..." : "Dispatch Clarification Request"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
