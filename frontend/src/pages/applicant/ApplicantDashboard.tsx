import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { ProgressTracker } from "../../components/common/ProgressTracker";
import { Application } from "../../types";
import {
  FileText,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const ApplicantDashboard: React.FC = () => {
  const [data, setData] = useState<{
    applications: Application[];
    totalApplications: number;
    unreadNotificationsCount: number;
    educationRecordsCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get("/dashboard/applicant");
        setData(res.data.data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-xs text-slate-500">Loading your applicant portal...</div>;
  }

  const applications = data?.applications || [];
  const primaryApp = applications[0];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Applicant Portal</h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
          Track your admission stages, upload verification documents, and monitor academic eligibility evaluation.
        </p>

        <div className="flex flex-wrap gap-3 mt-5">
          <Link
            to="/applicant/apply"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
          >
            <FileText className="w-4 h-4" /> Apply for Programme
          </Link>
          <Link
            to="/applicant/education"
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <GraduationCap className="w-4 h-4" /> Academic Records ({data?.educationRecordsCount || 0})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.totalApplications || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Submitted Applications</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.educationRecordsCount || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Education Qualifications</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{data?.unreadNotificationsCount || 0}</div>
            <div className="text-xs text-slate-500 font-medium">Unread Notifications</div>
          </div>
        </Card>
      </div>

      {/* Primary Active Application Status & 5-Stage Tracker */}
      {primaryApp ? (
        <Card
          title={`Active Application: ${primaryApp.programme_name} (${primaryApp.programme_code})`}
          subtitle={`Reference: ${primaryApp.application_reference}`}
          action={
            <Badge variant={getStatusBadgeVariant(primaryApp.application_status)}>
              {primaryApp.application_status}
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="text-xs text-slate-600 font-medium">
              Current Screening Stage: <span className="text-blue-600 font-bold">{primaryApp.stage_name}</span> (Stage {primaryApp.stage_order} of 5)
            </div>

            {/* Visual 5-Stage Tracker */}
            <ProgressTracker
              currentStageOrder={primaryApp.stage_order || 1}
              applicationStatus={primaryApp.application_status}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Applied on: {new Date(primaryApp.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/applicant/applications`}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  View Details & Documents <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-center py-10">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Admission Applications Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Browse our university programmes and submit your application for the current academic cycle.
          </p>
          <Link
            to="/applicant/apply"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2"
          >
            Start New Application <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      )}
    </div>
  );
};
