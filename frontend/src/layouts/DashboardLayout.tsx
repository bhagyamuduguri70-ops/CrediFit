import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#172033]">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setCollapsed(!collapsed)}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
        collapsed={collapsed}
      />

      <div className="flex flex-1 relative overflow-x-hidden">
        {/* Desktop & Mobile Responsive Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
