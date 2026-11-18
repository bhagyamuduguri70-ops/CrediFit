import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { Users, Search, Phone, Mail, MapPin } from "lucide-react";

export const ApplicantListPage: React.FC = () => {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadApplicants = async () => {
    try {
      const res = await api.get(`/applicants?search=${encodeURIComponent(search)}`);
      setApplicants(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registered Applicants</h1>
          <p className="text-xs text-slate-500 mt-1">Directory of student accounts and profiles in MySQL</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading applicant directory...</div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No applicants found matching your query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Total Applications</th>
                  <th className="py-2.5 px-3">Account Status</th>
                  <th className="py-2.5 px-3">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((a) => (
                  <tr key={a.user_id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{a.full_name}</div>
                      <div className="text-[11px] text-slate-400">ID: #{a.user_id}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {a.email}
                      </div>
                      {a.phone && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {a.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {a.city || a.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{a.city ? `${a.city}, ` : ""}{a.state}</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">
                      {a.total_applications} applied
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={getStatusBadgeVariant(a.account_status)} size="sm">
                        {a.account_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(a.created_at).toLocaleDateString()}
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
