"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Palette,
  Building2,
  Settings,
  Plus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  FileStack,
  Unlock,
  PenLine,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BunoLogo } from "@/components/ui/BunoLogo";

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    profile?: {
      businessName?: string;
      logoUrl?: string;
    };
  } | null;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Templates", href: "/templates", icon: Palette },
  { label: "Business Profile", href: "/business", icon: Building2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const pdfNavItems = [
  { label: "Merge PDFs", href: "/tools/merge-pdf", icon: FileStack },
  { label: "Password Remover", href: "/tools/pdf-password-remover", icon: Unlock },
  { label: "PDF Editor", href: "/tools/pdf-editor", icon: PenLine },
  { label: "Image to PDF", href: "/tools/image-to-pdf", icon: ImageIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ user }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      toast.success("Logged out successfully");
      router.push("/auth/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          className="p-2 rounded-lg bg-white border border-[#E8E8E5] text-[#202124] shadow-sm hover:bg-[#F5F5F3]"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-xs z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-[#E8E8E5] z-40 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          collapsed ? "w-20" : "w-64"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#F0F0EE]">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 focus:outline-none"
              onClick={() => setMobileOpen(false)}
            >
              <BunoLogo size={34} showText={!collapsed} />
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-[#70757A] hover:bg-[#F5F5F3] hover:text-[#202124] transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Quick Create Invoice Action */}
          <div className="p-4">
            <Link
              href="/invoices/new"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-[#4468E8] hover:bg-[#3455D1] text-white rounded-xl text-sm font-medium shadow-xs transition-all ${
                collapsed ? "px-0" : ""
              }`}
              title="Create New Invoice"
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!collapsed && <span>New Invoice</span>}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#EEF2FF] text-[#4468E8]"
                      : "text-[#5F6368] hover:bg-[#F5F5F3] hover:text-[#202124]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#4468E8]" : "text-[#70757A]"
                    }`}
                  />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* PDF Utilities Navigation Section */}
          <div className="pt-3 px-3">
            {!collapsed && (
              <div className="flex items-center justify-between px-3.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9AA0A6]">
                <span>PDF Utilities</span>
                <Link
                  href="/tools"
                  onClick={() => setMobileOpen(false)}
                  className="hover:text-[#4468E8] lowercase font-normal transition-colors"
                >
                  all tools
                </Link>
              </div>
            )}
            <div className="space-y-0.5">
              {pdfNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#EEF2FF] text-[#4468E8] font-semibold"
                        : "text-[#5F6368] hover:bg-[#F5F5F3] hover:text-[#202124]"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-[#4468E8]" : "text-[#70757A]"
                      }`}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Profile & Account Footer */}
        <div className="p-3 border-t border-[#F0F0EE]">
          <div
            className={`flex items-center justify-between p-2 rounded-xl bg-[#FAFAF8] border border-[#E8E8E5] ${
              collapsed ? "flex-col gap-2 p-1.5" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#E8E8E5] flex items-center justify-center text-xs font-semibold text-[#202124] shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-[#202124] truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[10px] text-[#70757A] truncate">
                    {user?.email || ""}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-[#70757A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
