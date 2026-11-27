"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileStack,
  Unlock,
  FileEdit,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Lock,
} from "lucide-react";
import { BunoLogo } from "@/components/ui/BunoLogo";

interface ToolsLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  activeTool?: "merge" | "unlock" | "edit" | "image" | "hub";
  wide?: boolean;
  hideHeader?: boolean;
}

export const PDF_TOOLS = [
  {
    id: "merge",
    name: "Merge PDFs",
    href: "/tools/merge-pdf",
    icon: FileStack,
    color: "#4468E8",
    desc: "Combine multiple PDF files into one clean document with custom order.",
  },
  {
    id: "unlock",
    name: "Password Remover",
    href: "/tools/pdf-password-remover",
    icon: Unlock,
    color: "#E06D38",
    desc: "Remove passwords and printing/copying restrictions permanently.",
  },
  {
    id: "edit",
    name: "PDF Editor",
    href: "/tools/pdf-editor",
    icon: FileEdit,
    color: "#10B981",
    desc: "Add text, annotations, signatures, drawings, and rotate/delete pages.",
  },
  {
    id: "image",
    name: "Image to PDF",
    href: "/tools/image-to-pdf",
    icon: ImageIcon,
    color: "#8B5CF6",
    desc: "Convert JPG, PNG, WebP images to high-quality PDF with custom margins.",
  },
];

export const ToolsLayout: React.FC<ToolsLayoutProps> = ({
  children,
  title,
  subtitle,
  activeTool,
  wide = false,
  hideHeader = false,
}) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#202124] flex flex-col font-sans selection:bg-[#4468E8]/10 selection:text-[#4468E8]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 focus:outline-none">
              <BunoLogo size="sm" />
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#EEF2FF] text-[#4468E8] border border-blue-200/50">
                PDF Tools
              </span>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/tools"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pathname === "/tools"
                    ? "bg-[#F5F5F3] text-[#202124] font-semibold"
                    : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAFAF8]"
                }`}
              >
                All Tools
              </Link>
              {PDF_TOOLS.map((t) => {
                const isActive = pathname === t.href;
                const Icon = t.icon;
                return (
                  <Link
                    key={t.id}
                    href={t.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#EEF2FF] text-[#4468E8] font-semibold"
                        : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F172A] hover:bg-black rounded-lg shadow-2xs transition-all"
            >
              <span>Create Invoice</span>
              <ArrowRight className="w-3.5 h-3.5 hidden xs:inline" />
            </Link>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden overflow-x-auto border-t border-[#F0F0EE] px-4 py-2 flex items-center gap-2 no-scrollbar">
          <Link
            href="/tools"
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${
              pathname === "/tools"
                ? "bg-[#0F172A] text-white"
                : "bg-white text-[#5F6368] border border-[#E8E8E5]"
            }`}
          >
            All Tools
          </Link>
          {PDF_TOOLS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 ${
                pathname === t.href
                  ? "bg-[#4468E8] text-white font-semibold"
                  : "bg-white text-[#5F6368] border border-[#E8E8E5]"
              }`}
            >
              <t.icon className="w-3 h-3" />
              <span>{t.name}</span>
            </Link>
          ))}
        </div>
      </header>

      {/* Main Tool Container */}
      <main
        className={`flex-1 w-full mx-auto ${
          wide
            ? "max-w-[1600px] px-2 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4"
            : "max-w-5xl px-4 sm:px-6 py-6 sm:py-10 space-y-6"
        }`}
      >
        {/* Title Header with Security Badges */}
        {!hideHeader && (
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[11px] font-medium shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Client-Side • Private & Secure • No Sign-Up Needed</span>
            </div>

            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#202124] tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[#70757A] leading-relaxed">
              {subtitle}
            </p>
          </div>
        )}

        {/* Tool Content Rendered Here */}
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E5] bg-white py-8 px-4 text-center text-xs text-[#70757A] space-y-3 mt-12">
        <div className="flex flex-wrap justify-center gap-6 font-medium">
          <Link href="/tools/merge-pdf" className="hover:text-[#202124]">
            Merge PDFs
          </Link>
          <Link href="/tools/pdf-password-remover" className="hover:text-[#202124]">
            PDF Password Remover
          </Link>
          <Link href="/tools/pdf-editor" className="hover:text-[#202124]">
            PDF Editor
          </Link>
          <Link href="/tools/image-to-pdf" className="hover:text-[#202124]">
            Image to PDF
          </Link>
          <Link href="/" className="hover:text-[#202124]">
            Invoice Generator
          </Link>
        </div>
        <p className="text-[11px] text-[#9AA0A6]">
          All PDF processing executes locally in your browser. Files are never transmitted or stored on any server.
        </p>
      </footer>
    </div>
  );
};
