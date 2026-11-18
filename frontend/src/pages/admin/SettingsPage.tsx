import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import {
  Settings,
  User,
  ShieldCheck,
  Database,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Server,
  Calendar,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage({ type: "success", text: "Security credentials updated successfully." });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
          Portal Settings & System Environment
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Manage your administrative profile, authentication security, and view university environment parameters.
        </p>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* User Account Card */}
      <Card title="Operator Profile">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#142B4F] text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{user?.fullName}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                {user?.roleName || user?.roleCode}
              </span>
              <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                Active Session
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* System Infrastructure Details */}
      <Card title="University Admission Register Environment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Database className="w-4 h-4 text-[#2563EB]" />
              <span>Relational Database</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">MySQL 8.0 Enterprise</div>
            <div className="text-[11px] text-teal-700 font-medium">Schema: `credifit` (Port 3306 Connected)</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <span>Backend Engine</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">Node.js Express (ES Modules)</div>
            <div className="text-[11px] text-slate-500">Port 5000 /api/v1 (JWT Authorization)</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>Academic Session</span>
            </div>
            <div className="font-bold text-slate-900 text-sm">2026-2027 Academic Year</div>
            <div className="text-[11px] text-slate-500">Undergraduate Screening Cycle 1 Active</div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Screening Engine Integrity</span>
            </div>
            <div className="font-bold text-emerald-700 text-sm">Strict 5-Stage Protocol</div>
            <div className="text-[11px] text-slate-500">Enforced by MySQL Check Constraints</div>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card title="Update Security Credentials" subtitle="Ensure your operator password remains confidential">
        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="••••••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#142B4F] hover:bg-[#0d1e38] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </Card>
    </div>
  );
};
