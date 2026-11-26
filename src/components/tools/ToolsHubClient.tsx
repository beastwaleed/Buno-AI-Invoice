"use client";

import React from "react";
import Link from "next/link";
import {
  FileStack,
  Unlock,
  FileEdit,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import { ToolsLayout, PDF_TOOLS } from "./ToolsLayout";

const TOOL_DETAILS = [
  {
    id: "merge",
    name: "Merge PDFs",
    href: "/tools/merge-pdf",
    icon: FileStack,
    badge: "Most Popular",
    color: "from-blue-500 to-indigo-600",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50",
    desc: "Combine multiple PDF documents into a single organized file with customizable page sequences and instant reordering.",
    features: [
      "Merge unlimited PDF files",
      "Interactive drag-and-drop ordering",
      "Page count inspection per file",
      "100% private in-browser processing",
    ],
    cta: "Merge PDFs Now",
  },
  {
    id: "unlock",
    name: "PDF Password Remover",
    href: "/tools/pdf-password-remover",
    icon: Unlock,
    badge: "Security Tool",
    color: "from-orange-500 to-amber-600",
    textColor: "text-orange-600",
    bgLight: "bg-orange-50",
    desc: "Permanently strip open passwords and permission restrictions (print, copy, edit locks) to produce an unencrypted, fully unlocked PDF.",
    features: [
      "Strips print & copy restrictions",
      "Unlocks password-protected files",
      "Permanently unencrypts PDFs",
      "Zero file upload to server",
    ],
    cta: "Unlock PDF",
  },
  {
    id: "edit",
    name: "PDF Editor",
    href: "/tools/pdf-editor",
    icon: FileEdit,
    badge: "Interactive",
    color: "from-emerald-500 to-teal-600",
    textColor: "text-emerald-600",
    bgLight: "bg-emerald-50",
    desc: "Annotate, add text, draw freehand highlights, stamp your signature, and rotate or delete specific pages directly in your browser.",
    features: [
      "Type text anywhere on any page",
      "Digital signature pad & stamp",
      "Freehand pen & highlight boxes",
      "Page rotation & page deletion",
    ],
    cta: "Edit PDF Online",
  },
  {
    id: "image",
    name: "Image to PDF",
    href: "/tools/image-to-pdf",
    icon: ImageIcon,
    badge: "Fast Converter",
    color: "from-purple-500 to-violet-600",
    textColor: "text-purple-600",
    bgLight: "bg-purple-50",
    desc: "Convert your JPG, PNG, and WebP images into a crisp, multi-page PDF document with custom margins, orientation, and page sizing.",
    features: [
      "Supports JPG, PNG, WebP & GIF",
      "Custom page sizes (A4, Letter, Fit)",
      "Auto or manual orientation",
      "Adjustable border margins",
    ],
    cta: "Convert Images",
  },
];

export const ToolsHubClient: React.FC = () => {
  return (
    <ToolsLayout
      title="Free PDF Utilities Suite"
      subtitle="Fast, high-fidelity PDF tools operating 100% locally in your browser. No sign-up, no subscriptions, and zero file uploads."
      activeTool="hub"
    >
      <div className="space-y-8">
        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOL_DETAILS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="bg-white rounded-2xl border border-[#E8E8E5] p-6 shadow-subtle hover:shadow-elevated hover:border-[#4468E8]/40 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-xl ${tool.bgLight} ${tool.textColor} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FAFAF8] border border-[#E8E8E5] text-[#70757A]">
                      {tool.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#202124] group-hover:text-[#4468E8] transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-[#70757A] mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>

                  <div className="pt-2 space-y-1.5 border-t border-[#F5F5F3]">
                    {tool.features.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-[#5F6368]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={tool.href}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] hover:bg-black text-white text-xs font-semibold rounded-xl transition-all shadow-xs group-hover:bg-[#4468E8]"
                >
                  <span>{tool.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Security & Privacy Commitment Banner */}
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/40 rounded-2xl border border-blue-200/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200 flex items-center justify-center text-[#4468E8] shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#0F172A]">
                Privacy First Architecture
              </h4>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Every document is parsed, edited, and rendered locally inside your browser session using WebAssembly & pure JavaScript.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-700 shadow-2xs">
              0 Bytes Uploaded
            </span>
          </div>
        </div>
      </div>
    </ToolsLayout>
  );
};
