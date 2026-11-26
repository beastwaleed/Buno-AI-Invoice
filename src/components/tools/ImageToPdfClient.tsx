"use client";

import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Trash2,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { ToolsLayout } from "./ToolsLayout";
import {
  convertImagesToPdf,
  ImageToPdfItem,
  ImageToPdfOptions,
} from "@/lib/pdf/imageToPdf";

export const ImageToPdfClient: React.FC = () => {
  const [items, setItems] = useState<ImageToPdfItem[]>([]);
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [margin, setMargin] = useState<"none" | "small" | "normal">("none");
  const [outputFilename, setOutputFilename] = useState("converted-images.pdf");
  const [isConverting, setIsConverting] = useState(false);

  const [convertedResult, setConvertedResult] = useState<{
    blob: Blob;
    url: string;
    pageCount: number;
    size: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);

    const newItems: ImageToPdfItem[] = [];
    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a supported image file.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        rotation: 0,
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const handleRotate = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, rotation: ((item.rotation || 0) + 90) % 360 }
          : item
      )
    );
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[targetIdx];
      copy[targetIdx] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (id: string) => {
    setItems((prev) => {
      const removed = prev.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleConvert = async () => {
    if (items.length === 0) {
      toast.error("Please add at least 1 image to convert.");
      return;
    }

    setIsConverting(true);
    const toastId = toast.loading("Converting images to PDF...");

    try {
      const { blob, pageCount } = await convertImagesToPdf(items, {
        pageSize,
        orientation,
        margin,
      });
      const url = URL.createObjectURL(blob);
      setConvertedResult({
        blob,
        url,
        pageCount,
        size: blob.size,
      });
      toast.success("Images converted to PDF successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Image to PDF error:", err);
      toast.error(err?.message || "Failed to convert images to PDF.", { id: toastId });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedResult) return;
    const a = document.createElement("a");
    a.href = convertedResult.url;
    a.download = outputFilename.endsWith(".pdf") ? outputFilename : `${outputFilename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (convertedResult?.url) URL.revokeObjectURL(convertedResult.url);
    setConvertedResult(null);
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setItems([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ToolsLayout
      title="Image to PDF Converter"
      subtitle="Convert your JPG, PNG, and WebP images into a high-resolution, multi-page PDF document. 100% free and in-browser."
      activeTool="image"
    >
      <div className="space-y-6">
        {/* Upload Zone */}
        {items.length === 0 && !convertedResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#8B5CF6] bg-white rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-[#F5F3FF]/30 group shadow-subtle space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <ImageIcon className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#202124]">
                Choose images to convert
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Drag and drop JPG, PNG, or WebP images here, or click to browse files from your device.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                Select Images
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Image Grid & Conversion Settings */}
        {items.length > 0 && !convertedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-5 sm:p-6 shadow-subtle space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0F0EE]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124] flex items-center gap-2">
                  <span>Selected Images</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-purple-50 text-purple-700">
                    {items.length} {items.length === 1 ? "image" : "images"}
                  </span>
                </h3>
                <p className="text-xs text-[#70757A] mt-0.5">
                  Rotate or reorder images to set their order in the generated PDF.
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
                  onClick={() => setItems([])}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative bg-[#FAFAF8] rounded-xl border border-[#E8E8E5] overflow-hidden p-2 flex flex-col justify-between space-y-2 hover:border-purple-300 transition-all"
                >
                  <div className="h-32 bg-white rounded-lg flex items-center justify-center overflow-hidden relative">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      style={{
                        transform: `rotate(${item.rotation || 0}deg)`,
                      }}
                      className="max-h-full max-w-full object-contain transition-transform duration-150 select-none"
                    />
                    <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-black/60 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#202124] truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-[#70757A]">
                      {formatSize(item.size)}
                    </p>
                  </div>

                  {/* Image card controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E8E8E5]/50">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-[#70757A] hover:text-[#202124] disabled:opacity-20"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === items.length - 1}
                        className="p-1 text-[#70757A] hover:text-[#202124] disabled:opacity-20"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRotate(item.id)}
                        className="p-1 text-[#70757A] hover:text-purple-600"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1 text-[#70757A] hover:text-red-600"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Formatting Settings */}
            <div className="bg-[#FAFAF8] p-4 rounded-xl border border-[#E8E8E5] space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202124]">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>PDF Page Formatting Options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[#70757A] mb-1">
                    Page Size
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e: any) => setPageSize(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E8E8E5] bg-white text-[#202124]"
                  >
                    <option value="a4">A4 (Standard 210 × 297mm)</option>
                    <option value="letter">Letter (US 8.5 × 11in)</option>
                    <option value="fit">Fit to Image Dimensions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#70757A] mb-1">
                    Page Orientation
                  </label>
                  <select
                    value={orientation}
                    onChange={(e: any) => setOrientation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E8E8E5] bg-white text-[#202124]"
                  >
                    <option value="auto">Auto (Match Image Ratio)</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#70757A] mb-1">
                    Margin
                  </label>
                  <select
                    value={margin}
                    onChange={(e: any) => setMargin(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E8E8E5] bg-white text-[#202124]"
                  >
                    <option value="none">No Margin (Edge-to-Edge)</option>
                    <option value="small">Small Margin (7mm)</option>
                    <option value="normal">Normal Margin (14mm)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 max-w-sm w-full">
                <span className="text-xs text-[#70757A] whitespace-nowrap">Output Name:</span>
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                  placeholder="converted-images.pdf"
                />
              </div>

              <button
                type="button"
                onClick={handleConvert}
                disabled={isConverting || items.length === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <ImageIcon className="w-4 h-4" />
                <span>{isConverting ? "Converting..." : "Convert to PDF"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {convertedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-8 shadow-subtle text-center space-y-5 animate-in fade-in zoom-in-95 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#202124]">
                Images Converted Successfully!
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Your new PDF document has {convertedResult.pageCount} pages ({formatSize(convertedResult.size)}) and is ready to download.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] text-xs font-semibold rounded-xl border border-[#E8E8E5] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Convert More Images</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolsLayout>
  );
};
