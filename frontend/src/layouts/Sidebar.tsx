import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Files,
  FileCheck2,
  CheckSquare,
  Award,
  CheckCircle,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
  ScrollText,
  HelpCircle,
  GraduationCap,
  Calendar,
  Layers,
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.roleCode;

  // Applicant Navigation Links
  const applicantLinks = [
    { to: "/applicant/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/applicant/profile", label: "Applicant Profile", icon: Users },
    { to: "/applicant/education", label: "Education Records", icon: GraduationCap },
    { to: "/applicant/programmes", label: "Degree Catalog", icon: BookOpen },
    { to: "/applicant/apply", label: "New Application", icon: Files },
    { to: "/applicant/applications", label: "My Applications", icon: CheckSquare },
    { to: "/applicant/clarifications", label: "Clarifications", icon: HelpCircle },
  ];

  // Evaluator Navigation Links
  const evaluatorLinks = [
    { to: "/evaluator/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/evaluator/assignments", label: "Assigned Applications", icon: Files },
  ];

  // Officer Navigation Links
  const officerLinks = [
    { to: "/officer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/applicants", label: "Applicants", icon: Users },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/applications", label: "Applications", icon: Files },
    { to: "/admin/documents", label: "Document Verification", icon: FileCheck2 },
    { to: "/admin/screening", label: "Stage-Wise Screening", icon: Layers },
    { to: "/admin/merit-list", label: "Merit Screening", icon: Award },
    { to: "/admin/decisions", label: "Admission Confirmation", icon: CheckCircle },
    { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/officer/clarifications", label: "Clarification Inbox", icon: HelpCircle },
  ];

  // Administrator Navigation Links (full suite matching user requirements)
  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/applicants", label: "Applicants", icon: Users },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/applications", label: "Applications", icon: Files },
    { to: "/admin/documents", label: "Document Verification", icon: FileCheck2 },
    { to: "/admin/screening", label: "Stage-Wise Screening", icon: Layers },
    { to: "/admin/merit-list", label: "Merit Screening", icon: Award },
    { to: "/admin/decisions", label: "Admission Confirmation", icon: CheckCircle },
    { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
    { to: "/admin/users", label: "User Management", icon: UserCheck },
    { to: "/admin/audit-logs", label: "System Audit Logs", icon: ScrollText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  let links = applicantLinks;
  if (role === "ADMIN") links = adminLinks;
  else if (role === "ADMISSION_OFFICER") links = officerLinks;
  else if (role === "EVALUATOR") links = evaluatorLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#142B4F] text-slate-200">
      {/* Sidebar Header & Brand */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shrink-0 shadow-sm font-bold">
            <ShieldCheck className="w-5 h-5 text-teal-300" />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <span className="font-bold text-sm tracking-tight text-white block">CrediFit</span>
              <span className="text-[10px] text-teal-300 font-medium uppercase tracking-wider block">
                {user.roleName || user.roleCode}
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>
        )}

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onCloseMobile}
              title={collapsed ? link.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
                  ? "bg-[#2563EB] text-white font-semibold shadow-xs"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
                } ${collapsed ? "justify-center px-2" : ""}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle & Logout Footer */}
      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`w-full hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors ${collapsed ? "justify-center px-2" : ""
              }`}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Menu</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            logout();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors ${collapsed ? "justify-center px-2" : ""
            }`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed / Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200/80 z-30 ${collapsed ? "w-18" : "w-64"
          }`}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
