import React from "react";
import { CheckCircle2, Clock, XCircle, AlertCircle, ShieldAlert } from "lucide-react";

interface StageItem {
  order: number;
  id: number;
  name: string;
  shortDesc: string;
}

export const CANONICAL_STAGES: StageItem[] = [
  { order: 1, id: 1, name: "Application Screening", shortDesc: "Profile & Qualification Submission" },
  { order: 2, id: 2, name: "Document Verification", shortDesc: "Certificate & Marksheet Audit" },
  { order: 3, id: 3, name: "Eligibility Screening", shortDesc: "Automated Academic Cutoff Rules" },
  { order: 4, id: 4, name: "Department Review", shortDesc: "Faculty Rubric Criteria Scoring" },
  { order: 5, id: 5, name: "Admission Confirmation", shortDesc: "Formal Offer & Seat Allocation" },
];

interface ProgressTrackerProps {
  currentStageOrder?: number;
  applicationStatus?: string;
  stageHistory?: Array<{
    stage_order?: number;
    stage_id?: number;
    stage_status?: string;
    stage_name?: string;
    remarks?: string;
    changed_at?: string;
  }>;
  compact?: boolean;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStageOrder = 1,
  applicationStatus = "SUBMITTED",
  stageHistory = [],
  compact = false,
}) => {
  const isRejected = ["REJECTED", "NOT_ADMITTED", "INELIGIBLE"].includes(applicationStatus.toUpperCase());
  const isAdmitted = applicationStatus.toUpperCase() === "ADMITTED";

  // Build a lookup map from stageHistory if provided
  const historyByOrder = new Map<number, any>();
  stageHistory.forEach((h) => {
    const ord = h.stage_order || h.stage_id;
    if (ord) historyByOrder.set(ord, h);
  });

  return (
    <div className="w-full">
      <div className="relative">
        {/* Connecting progress line */}
        <div className="hidden md:block absolute top-4.5 left-10 right-10 h-0.5 bg-slate-200 -z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-2">
          {CANONICAL_STAGES.map((stg) => {
            const histItem = historyByOrder.get(stg.order);
            const histStatus = histItem?.stage_status?.toUpperCase();

            let status: "completed" | "current" | "pending" | "failed" = "pending";

            if (histStatus === "FAIL" || (isRejected && stg.order === currentStageOrder)) {
              status = "failed";
            } else if (
              histStatus === "PASS" ||
              stg.order < currentStageOrder ||
              (stg.order === 5 && isAdmitted)
            ) {
              status = "completed";
            } else if (stg.order === currentStageOrder) {
              status = "current";
            }

            return (
              <div
                key={stg.order}
                className="flex flex-col items-center text-center relative z-10 group bg-white/70 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-0 border-slate-100"
              >
                {/* Stage circle icon */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 shadow-xs ${
                    status === "completed"
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                      : status === "current"
                      ? "bg-[#2563EB] text-white ring-4 ring-blue-50 ring-offset-1"
                      : status === "failed"
                      ? "bg-rose-600 text-white ring-4 ring-rose-50"
                      : "bg-white text-slate-400 border border-slate-300"
                  }`}
                >
                  {status === "completed" && <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />}
                  {status === "current" && <Clock className="w-4.5 h-4.5 stroke-[2.5] animate-spin-slow" />}
                  {status === "failed" && <XCircle className="w-4.5 h-4.5 stroke-[2.5]" />}
                  {status === "pending" && <span>{stg.order}</span>}
                </div>

                {/* Stage titles and badges */}
                <div className="mt-2 text-center w-full">
                  <div className="text-xs font-semibold text-slate-900 truncate px-1">
                    {stg.name}
                  </div>
                  {!compact && (
                    <div className="text-[11px] text-slate-500 hidden lg:block truncate px-1 mt-0.5">
                      {stg.shortDesc}
                    </div>
                  )}

                  {/* Status pill */}
                  <div className="mt-1">
                    {status === "completed" && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                        PASS
                      </span>
                    )}
                    {status === "current" && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                        IN PROGRESS
                      </span>
                    )}
                    {status === "failed" && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                        FAIL
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
