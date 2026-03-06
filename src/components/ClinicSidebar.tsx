/**
 * ClinicSidebar - Reusable sidebar navigation for Student and Admin portals.
 * Uses the dark forest green theme from our design system.
 */
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { LucideIcon } from "lucide-react";
import logo from "@/assets/logo.webp";

interface SidebarLink {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ClinicSidebarProps {
  links: SidebarLink[];
  title: string;
  activeLink: string;
}

const ClinicSidebar = ({ links, title, activeLink }: ClinicSidebarProps) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Sign out and redirect to landing page */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const sidebarContent = (
    <>
      {/* Logo and Portal title */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-2">
          <img src={logo} alt="AAIS Logo" className="w-10 h-10 rounded-full" />
          <h2 className="text-lg font-bold text-primary-foreground">{title}</h2>
        </div>
        <p className="text-xs text-sidebar-foreground/60">Army's Angels Integrated School</p>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeLink === link.label;
          return (
            <button
              key={link.label}
              onClick={() => {
                link.onClick();
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors
                ${isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground hover:bg-sidebar-accent"
                }`}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Logout button at the bottom */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-primary-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground p-2 rounded-md"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen bg-primary flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside className={`md:hidden fixed top-0 left-0 w-64 min-h-screen bg-primary flex flex-col z-40 transform transition-transform ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default ClinicSidebar;
