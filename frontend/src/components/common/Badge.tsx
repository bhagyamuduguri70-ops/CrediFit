import React from "react";

export type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral"
  | "primary"
  | "teal";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      dot: "bg-emerald-500",
    },
    danger: {
      bg: "bg-rose-50 text-rose-700 border-rose-200/80",
      dot: "bg-rose-500",
    },
    warning: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      dot: "bg-amber-500",
    },
    info: {
      bg: "bg-sky-50 text-sky-700 border-sky-200/80",
      dot: "bg-sky-500",
    },
    primary: {
      bg: "bg-blue-50 text-blue-700 border-blue-200/80",
      dot: "bg-blue-500",
    },
    teal: {
      bg: "bg-teal-50 text-teal-700 border-teal-200/80",
      dot: "bg-teal-500",
    },
    neutral: {
      bg: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-0.5 text-xs font-medium",
    lg: "px-3 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant].bg} ${sizeStyles[size]} tracking-tight shadow-xs`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variantStyles[variant].dot}`} />}
      {children}
    </span>
  );
};

export function getStatusBadgeVariant(status: string = ""): BadgeVariant {
  const s = (status || "").toUpperCase();
  if (["PASS", "VERIFIED", "ELIGIBLE", "ADMITTED", "RESOLVED", "ACTIVE", "COMPLETED", "APPROVED"].includes(s)) {
    return "success";
  }
  if (["FAIL", "REJECTED", "NOT_ELIGIBLE", "NOT_ADMITTED", "SUSPENDED", "INACTIVE"].includes(s)) {
    return "danger";
  }
  if (
    [
      "PENDING",
      "IN_PROGRESS",
      "UNDER_REVIEW",
      "WAITLISTED",
      "CLARIFICATION_REQUESTED",
      "CLARIFICATION_REQUIRED",
      "OPEN",
      "RESPONDED",
    ].includes(s)
  ) {
    return "warning";
  }
  if (["SUBMITTED", "DRAFT"].includes(s)) {
    return "info";
  }
  return "neutral";
}
