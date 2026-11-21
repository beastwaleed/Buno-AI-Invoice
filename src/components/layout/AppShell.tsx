"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import Link from "next/link";
import { Sparkles, Bell, Plus } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  user?: any;
  title?: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  user,
  title,
  subtitle,
  actionButton,
}) => {
  return (
    <div className="flex min-h-screen bg-[#FAFAF8]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E8E8E5] px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="pl-12 lg:pl-0 min-w-0 pr-2">
            {title && (
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-tight text-[#202124] truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs text-[#70757A] -mt-0.5 truncate hidden sm:block">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/invoices/new?mode=ai"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-[#4468E8] bg-[#EEF2FF] hover:bg-blue-100 transition-colors border border-blue-200/60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Create with AI</span>
              <span className="xs:hidden">AI</span>
            </Link>

            {actionButton ? (
              actionButton
            ) : (
              <Link
                href="/invoices/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
