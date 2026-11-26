"use client";

import React, { useState, useRef } from "react";
import {
  Unlock,
  Lock,
  Upload,
  Eye,
  EyeOff,
  CheckCircle2,
  Download,
  RefreshCw,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ToolsLayout } from "./ToolsLayout";
import { inspectPdfProtection, unlockPdfDocument } from "@/lib/pdf/unlockPdf";

export const UnlockPdfClient: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [unlockedResult, setUnlockedResult] = useState<{
    blob: Blob;
    url: string;
    pageCount: number;
    unlockedType: "permissions" | "password";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    setSelectedFile(file);
    setPassword("");
    setUnlockedResult(null);
    setIsAnalyzing(true);

    try {
      const { isProtected, requiresPassword: reqPass } = await inspectPdfProtection(file);
      setRequiresPassword(reqPass);
      if (reqPass) {
        toast.info("This PDF is protected by an open password. Please enter it below.");
      } else if (isProtected) {
        toast.info("Permissions restriction detected. Click Unlock to strip all locks.");
      } else {
        toast.info("PDF ready to be processed.");
      }
    } catch {
      setRequiresPassword(true);
    } finally {
      setIsAnalyzing(false);
    }
    e.target.value = "";
  };

  const handleUnlock = async () => {
    if (!selectedFile) return;

    if (requiresPassword && !password) {
      toast.error("Please enter the PDF password to decrypt.");
      return;
    }

    setIsUnlocking(true);
    const toastId = toast.loading("Decrypting and unlocking PDF...");

    try {
      const res = await unlockPdfDocument(selectedFile, password || undefined);
      const url = URL.createObjectURL(res.unlockedBlob);
      setUnlockedResult({
        blob: res.unlockedBlob,
        url,
        pageCount: res.pageCount,
        unlockedType: res.unlockedType,
      });
      toast.success("PDF unlocked successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Unlock error:", err);
      toast.error(
        err?.message || "Incorrect password or unsupported encryption format.",
        { id: toastId }
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleDownload = () => {
    if (!unlockedResult || !selectedFile) return;
    const a = document.createElement("a");
    a.href = unlockedResult.url;
    const originalName = selectedFile.name.replace(/\.pdf$/i, "");
    a.download = `${originalName}-unlocked.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (unlockedResult?.url) URL.revokeObjectURL(unlockedResult.url);
    setUnlockedResult(null);
    setSelectedFile(null);
    setPassword("");
    setRequiresPassword(false);
  };

  return (
    <ToolsLayout
      title="PDF Password Remover"
      subtitle="Permanently unlock password-protected PDFs and strip printing or copying restrictions with 100% in-browser privacy."
      activeTool="unlock"
    >
      <div className="space-y-6">
        {/* Upload Zone */}
        {!selectedFile && !unlockedResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#E06D38] bg-white rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-[#FFF7ED]/30 group shadow-subtle space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#E06D38] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <Unlock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#202124]">
                Choose a password-protected PDF
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Drag and drop your protected PDF here, or click to browse files from your computer.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E06D38] hover:bg-[#C95B2A] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                Select Protected PDF
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Selected File & Unlock Form */}
        {selectedFile && !unlockedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 shadow-subtle space-y-6 max-w-xl mx-auto">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#F0F0EE]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#E06D38] flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#202124] truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-[#70757A]">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-red-600 hover:underline shrink-0"
              >
                Change File
              </button>
            </div>

            {/* Password input or permissions note */}
            {requiresPassword ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202124] mb-1">
                    Enter Password to Unlock <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-[#70757A] mb-2">
                    Enter the password once. Our engine will permanently decrypt the PDF so you never need a password again.
                  </p>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter PDF password..."
                      className="w-full px-3 py-2 pr-10 text-xs rounded-xl border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#E06D38]/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#70757A] hover:text-[#202124]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/60 text-xs text-orange-950 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#E06D38]" />
                  Ready to strip security restrictions
                </p>
                <p className="text-[11px] text-orange-800">
                  This document has permissions locks (copying, printing, or form restrictions). Click below to remove all locks instantly.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleUnlock}
              disabled={isUnlocking || isAnalyzing || (requiresPassword && !password)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#E06D38] hover:bg-[#C95B2A] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>
                {isUnlocking ? "Unlocking PDF..." : "Unlock & Remove Password Permanently"}
              </span>
            </button>
          </div>
        )}

        {/* Unlocked Success State */}
        {unlockedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-8 shadow-subtle text-center space-y-5 animate-in fade-in zoom-in-95 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#202124]">
                PDF Unlocked Successfully!
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                All passwords and restrictions have been permanently removed. Your new document is completely open and ready to download.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Unlocked PDF</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] text-xs font-semibold rounded-xl border border-[#E8E8E5] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Unlock Another</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolsLayout>
  );
};
