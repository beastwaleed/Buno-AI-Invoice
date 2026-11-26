"use client";

import React, { useState, useRef } from "react";
import {
  FileStack,
  Upload,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ToolsLayout } from "./ToolsLayout";
import {
  mergePdfFiles,
  getPdfPageCount,
  MergePdfFileItem,
} from "@/lib/pdf/mergePdf";

export const MergePdfClient: React.FC = () => {
  const [files, setFiles] = useState<MergePdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [outputFilename, setOutputFilename] = useState("merged-document.pdf");
  const [mergedResult, setMergedResult] = useState<{
    blob: Blob;
    url: string;
    pageCount: number;
    size: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const newItems: MergePdfFileItem[] = [];
    for (const f of selected) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        toast.error(`${f.name} is not a valid PDF file`);
        continue;
      }
      const pageCount = await getPdfPageCount(f);
      newItems.push({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        name: f.name,
        size: f.size,
        pageCount,
      });
    }

    setFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please add at least 2 PDF files to merge.");
      return;
    }

    setIsMerging(true);
    const toastId = toast.loading("Merging PDF files locally...");

    try {
      const { blob, pageCount } = await mergePdfFiles(files.map((f) => f.file));
      const url = URL.createObjectURL(blob);
      setMergedResult({
        blob,
        url,
        pageCount,
        size: blob.size,
      });
      toast.success("PDFs merged successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Merge error:", err);
      toast.error(err?.message || "Failed to merge PDF files.", { id: toastId });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedResult) return;
    const a = document.createElement("a");
    a.href = mergedResult.url;
    a.download = outputFilename.endsWith(".pdf") ? outputFilename : `${outputFilename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (mergedResult?.url) URL.revokeObjectURL(mergedResult.url);
    setMergedResult(null);
    setFiles([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ToolsLayout
      title="Merge PDF Files"
      subtitle="Combine multiple PDF documents into one seamless file with custom ordering. 100% free and client-side."
      activeTool="merge"
    >
      <div className="space-y-6">
        {/* Upload Zone if empty */}
        {files.length === 0 && !mergedResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#4468E8] bg-white rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-[#EEF2FF]/20 group shadow-subtle space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] text-[#4468E8] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <FileStack className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#202124]">
                Choose PDF files to merge
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Drag and drop your PDF documents here, or click to browse files from your computer.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                Select PDF Files
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* File Queue & Organization */}
        {files.length > 0 && !mergedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-5 sm:p-6 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F0EE]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124] flex items-center gap-2">
                  <span>Files in Merge Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#EEF2FF] text-[#4468E8]">
                    {files.length} {files.length === 1 ? "file" : "files"}
                  </span>
                </h3>
                <p className="text-xs text-[#70757A] mt-0.5">
                  Use the arrows to adjust page ordering before merging.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] rounded-lg text-xs font-medium border border-[#E8E8E5] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add More</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* List of files */}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {files.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#E8E8E5] bg-[#FAFAF8] hover:bg-white hover:border-[#4468E8]/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-white border border-[#E8E8E5] flex items-center justify-center text-xs font-mono font-bold text-[#70757A] shrink-0">
                      {index + 1}
                    </span>
                    <FileText className="w-5 h-5 text-[#4468E8] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#202124] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-[#70757A]">
                        {formatSize(item.size)} • {item.pageCount || 1}{" "}
                        {item.pageCount === 1 ? "page" : "pages"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] disabled:opacity-30 rounded-lg transition-colors"
                      title="Move up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] disabled:opacity-30 rounded-lg transition-colors"
                      title="Move down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-[#70757A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Merge Settings & Action Bar */}
            <div className="pt-4 border-t border-[#F0F0EE] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <span className="text-xs text-[#70757A] whitespace-nowrap">Output Name:</span>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 font-mono"
                  placeholder="merged-document.pdf"
                />
              </div>

              <button
                type="button"
                onClick={handleMerge}
                disabled={isMerging || files.length < 2}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4468E8] hover:bg-[#3455D1] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <FileStack className="w-4 h-4" />
                <span>{isMerging ? "Merging..." : "Merge Files into 1 PDF"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Success / Download State */}
        {mergedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-8 shadow-subtle text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#202124]">
                PDFs Merged Successfully!
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Your merged document has {mergedResult.pageCount} pages ({formatSize(mergedResult.size)}) and is ready to download.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Merged PDF</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] text-xs font-semibold rounded-xl border border-[#E8E8E5] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Merge More Files</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolsLayout>
  );
};
