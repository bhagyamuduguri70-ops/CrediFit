import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerBorder?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  subtitle,
  action,
  headerBorder = true,
  padding = "md",
}) => {
  const paddingStyles = {
    none: "p-0",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-shadow duration-200 overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div
          className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            headerBorder ? "border-b border-slate-100" : ""
          }`}
        >
          <div>
            {typeof title === "string" ? (
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
