import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onToggleMobile?: () => void;
  collapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onToggleMobile,
  collapsed,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute breadcrumbs
  const pathParts = location.pathname.split("/").filter(Boolean);
  const getBreadcrumbTitle = () => {
    if (pathParts.length === 0) return "Dashboard";
    const last = pathParts[pathParts.length - 1];
    return last
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (user?.roleCode === "ADMIN" || user?.roleCode === "ADMISSION_OFFICER") {
      navigate(`/admin/applications?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 text-[#172033] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile hamburger + Brand + Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobile}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#142B4F] flex items-center justify-center font-bold text-white shadow-xs">
            <ShieldCheck className="w-5 h-5 text-teal-300" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold tracking-tight text-[#142B4F] text-base">CrediFit</span>
            <span className="text-[10px] text-teal-700 ml-1.5 font-semibold px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200">
              Admission Hub
            </span>
          </div>
        </Link>

        {/* Breadcrumb separator */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-500">
          <span className="text-slate-400 capitalize">{pathParts[0] || "Portal"}</span>
          <span>/</span>
          <span className="font-semibold text-slate-900">{getBreadcrumbTitle()}</span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search application #, applicant name, programme..."
            className="w-full pl-9 pr-14 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
          />
          <div className="absolute right-2.5 top-2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
            Enter
          </div>
        </form>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon with Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 text-slate-600 hover:text-[#142B4F] hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-full">
                  System Live
                </span>
              </div>
              <div className="p-4 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-teal-500 mx-auto mb-1.5 opacity-80" />
                <p className="font-semibold text-slate-800">All notifications up to date</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Database triggers monitor stage progressions.</p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill & Dropdown */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 pl-2 sm:pl-2.5 rounded-lg hover:bg-slate-50 border border-slate-200/80 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#142B4F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.fullName || "Portal User"}
                </div>
                <div className="text-[10px] text-teal-700 font-medium">
                  {user.roleName || user.roleCode}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-full">
                    {user.roleName || user.roleCode}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/admin/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Portal Settings</span>
                  </Link>
                  <Link
                    to="/applicant/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>My Account</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-blue-600 shadow-xs transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
