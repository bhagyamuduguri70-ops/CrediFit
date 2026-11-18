import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  Eye,
  BookOpen,
  FileCheck2,
  Filter,
  CheckCircle2,
} from "lucide-react";

export const ApplicantManagementPage: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [applicantApps, setApplicantApps] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const loadApplicants = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/applicants?search=${encodeURIComponent(search)}`);
      setApplicants(res.data.data || []);
    } catch (err) {
      console.error("Failed to load applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplicants();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenDetails = async (applicant: any) => {
    setSelectedApplicant(applicant);
    setModalLoading(true);
    try {
      const res = await api.get(`/applications?search=${encodeURIComponent(applicant.full_name)}`);
      setApplicantApps(res.data.data || []);
    } catch (err) {
      console.error(err);
      setApplicantApps([]);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            Applicant Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Directory of registered student candidates, contact details, and application histories.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2563EB]" />
            <span>Registered Applicants Directory</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
              {applicants.length} Total
            </span>
          </div>
        }
      >
        <div className="cf-table-container">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Category</th>
                <th>Registered Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    Loading applicant records from MySQL...
                  </td>
                </tr>
              ) : applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                    No applicant records found.
                  </td>
                </tr>
              ) : (
                applicants.map((a: any) => (
                  <tr key={a.user_id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {a.full_name ? a.full_name[0].toUpperCase() : "A"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{a.full_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID #{a.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{a.email}</span>
                        </div>
                        {a.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{a.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-slate-600">
                      {a.city || a.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{[a.city, a.state].filter(Boolean).join(", ")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                        {a.category || "GENERAL"}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500">
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString()
                        : "Active"}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenDetails(a)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Applicant Details Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#142B4F] text-white flex items-center justify-center font-bold text-sm">
                  {selectedApplicant.full_name ? selectedApplicant.full_name[0].toUpperCase() : "A"}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedApplicant.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">Applicant ID #{selectedApplicant.user_id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Profile Details Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Personal & Contact Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email Address</span>
                    <span className="font-semibold text-slate-900">{selectedApplicant.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Mobile Phone</span>
                    <span className="font-semibold text-slate-900">
                      {selectedApplicant.phone || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Social Category</span>
                    <span className="font-semibold text-blue-700">
                      {selectedApplicant.category || "GENERAL"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Date of Birth</span>
                    <span className="font-semibold text-slate-900">
                      {selectedApplicant.date_of_birth
                        ? new Date(selectedApplicant.date_of_birth).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Gender</span>
                    <span className="font-semibold text-slate-900">
                      {selectedApplicant.gender || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Location</span>
                    <span className="font-semibold text-slate-900">
                      {[selectedApplicant.city, selectedApplicant.state].filter(Boolean).join(", ") ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Applications Submitted */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Associated Applications</span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {applicantApps.length} Submitted
                  </span>
                </h4>

                {modalLoading ? (
                  <div className="text-center py-4 text-xs text-slate-400">Loading applications...</div>
                ) : applicantApps.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200/80">
                    No applications submitted yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {applicantApps.map((app: any) => (
                      <div
                        key={app.application_id}
                        className="p-3.5 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#142B4F]">
                              {app.application_reference}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {app.programme_code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {app.programme_name} • Stage {app.current_stage_id || 1}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(app.application_status)} dot>
                            {app.application_status}
                          </Badge>
                          <Link
                            to={`/officer/applications/${app.application_id}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Inspect Application"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
