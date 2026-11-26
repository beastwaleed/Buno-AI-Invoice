"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Wand2,
  X,
  Check,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  removeLogoBackground,
  BackgroundRemovalResult,
  rgbToHex,
} from "@/lib/removeBackground";
import { toast } from "sonner";

interface LogoBackgroundModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onApplyTransparentLogo: (result: {
    dataUrl: string;
    file: File;
    tolerance: number;
    method: "flood" | "chroma";
  }) => Promise<void> | void;
  onRestoreOriginal?: () => void;
  initialTolerance?: number;
  initialMethod?: "flood" | "chroma";
}

const TEMPLATE_PREVIEW_BGS = [
  { id: "checkered", label: "Transparent", class: "bg-checkerboard", color: "transparent" },
  { id: "white", label: "Classic White", color: "#FFFFFF", border: true },
  { id: "charcoal", label: "Agency Dark", color: "#1F2937" },
  { id: "royal", label: "Royal Navy", color: "#1E3A8A" },
  { id: "crimson", label: "Crimson Red", color: "#881337" },
  { id: "amber", label: "Warm Amber", color: "#78350F" },
  { id: "indigo", label: "Modern Blue", color: "#312E81" },
];

export const LogoBackgroundModal: React.FC<LogoBackgroundModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyTransparentLogo,
  onRestoreOriginal,
  initialTolerance = 22,
  initialMethod = "flood",
}) => {
  const [tolerance, setTolerance] = useState<number>(initialTolerance);
  const [method, setMethod] = useState<"flood" | "chroma">(initialMethod);
  const [feather, setFeather] = useState<boolean>(true);
  const [selectedBg, setSelectedBg] = useState<string>("checkered");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedResult, setProcessedResult] = useState<BackgroundRemovalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Debounced processing ref
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processImage = async (tol: number, meth: "flood" | "chroma", feat: boolean) => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await removeLogoBackground(imageSrc, {
        tolerance: tol,
        method: meth,
        feather: feat,
      });
      setProcessedResult(result);
    } catch (err: any) {
      console.error("Failed to remove background:", err);
      setErrorMsg("Failed to process image. Try adjusting tolerance or using another format.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen && imageSrc) {
      setTolerance(initialTolerance);
      setMethod(initialMethod);
      processImage(initialTolerance, initialMethod, feather);
    }
  }, [isOpen, imageSrc]);

  const handleToleranceChange = (newVal: number) => {
    setTolerance(newVal);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      processImage(newVal, method, feather);
    }, 60);
  };

  const handleMethodChange = (newMethod: "flood" | "chroma") => {
    setMethod(newMethod);
    processImage(tolerance, newMethod, feather);
  };

  const handleFeatherToggle = () => {
    const nextFeather = !feather;
    setFeather(nextFeather);
    processImage(tolerance, method, nextFeather);
  };

  const handleApply = async () => {
    if (!processedResult) {
      toast.error("No processed image available.");
      return;
    }
    await onApplyTransparentLogo({
      dataUrl: processedResult.dataUrl,
      file: processedResult.file,
      tolerance,
      method,
    });
    toast.success("Logo background removed successfully!");
    onClose();
  };

  const handleRestore = () => {
    if (onRestoreOriginal) {
      onRestoreOriginal();
      toast.success("Original logo background restored.");
    }
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  const activeBgConfig = TEMPLATE_PREVIEW_BGS.find((b) => b.id === selectedBg);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#14171F] text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-white flex items-center gap-2">
                Remove Logo Background
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 font-normal">
                  Smart AI / Canvas
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Automatically strip solid backgrounds so your logo looks seamless on any template
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Main Visual Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Original */}
            <div className="bg-[#0B0D13] p-3.5 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium">Original Logo</span>
                {processedResult && (
                  <span className="text-[10px] flex items-center gap-1 text-neutral-400 font-mono">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block"
                      style={{ backgroundColor: processedResult.detectedColor.hex }}
                    />
                    Detected: {processedResult.detectedColor.hex}
                  </span>
                )}
              </div>
              <div className="h-44 sm:h-52 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-3 relative overflow-hidden">
                <img
                  src={imageSrc}
                  alt="Original logo"
                  className="max-h-full max-w-full object-contain select-none"
                />
              </div>
            </div>

            {/* Right: Transparent Preview */}
            <div className="bg-[#0B0D13] p-3.5 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span className="font-medium text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Transparent Result
                </span>
                {isProcessing && (
                  <span className="text-[10px] text-blue-400 animate-pulse font-mono">
                    Processing...
                  </span>
                )}
              </div>

              {/* Dynamic template preview backdrop */}
              <div
                className={`h-44 sm:h-52 rounded-lg border border-white/10 flex items-center justify-center p-3 relative overflow-hidden transition-colors ${
                  selectedBg === "checkered"
                    ? "bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:16px_16px] bg-[#111827]"
                    : ""
                }`}
                style={
                  selectedBg !== "checkered"
                    ? { backgroundColor: activeBgConfig?.color }
                    : undefined
                }
              >
                {processedResult ? (
                  <img
                    src={processedResult.dataUrl}
                    alt="Transparent logo preview"
                    className="max-h-full max-w-full object-contain select-none"
                  />
                ) : (
                  <div className="text-xs text-neutral-400 animate-pulse">Rendering...</div>
                )}
              </div>
            </div>
          </div>

          {/* Template Color Simulator Bar */}
          <div className="space-y-2 bg-[#0B0D13] p-3.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Preview on Template Backgrounds:
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {activeBgConfig?.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {TEMPLATE_PREVIEW_BGS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setSelectedBg(bg.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedBg === bg.id
                      ? "border-blue-400 bg-blue-500/10 text-white shadow-xs"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full inline-block shrink-0 ${
                      bg.border ? "border border-neutral-400" : ""
                    } ${
                      bg.id === "checkered"
                        ? "bg-[linear-gradient(45deg,#6b7280_25%,transparent_25%),linear-gradient(-45deg,#6b7280_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#6b7280_75%),linear-gradient(-45deg,transparent_75%,#6b7280_75%)] bg-[size:6px_6px] bg-neutral-300"
                        : ""
                    }`}
                    style={bg.id !== "checkered" ? { backgroundColor: bg.color } : undefined}
                  />
                  <span>{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tuning Sliders & Options */}
          <div className="bg-[#0B0D13] p-4 rounded-xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                Transparency Controls
              </span>
              <button
                type="button"
                onClick={() => {
                  setTolerance(22);
                  setMethod("flood");
                  setFeather(true);
                  processImage(22, "flood", true);
                }}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Tolerance Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300">Background Sensitivity (Tolerance)</span>
                <span className="font-mono text-blue-400 font-semibold">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                onChange={(e) => handleToleranceChange(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
              />
              <p className="text-[10px] text-neutral-400">
                Increase if faint background halo remains; decrease if parts of the logo graphic fade.
              </p>
            </div>

            {/* Removal Mode & Edge Smoothing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Removal Method
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => handleMethodChange("flood")}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                      method === "flood"
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Edges (Flood)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMethodChange("chroma")}
                    className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors ${
                      method === "chroma"
                        ? "bg-blue-600 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    All Matches
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Edges mode protects white graphics inside letters.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Edge Anti-Aliasing
                </label>
                <button
                  type="button"
                  onClick={handleFeatherToggle}
                  className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors ${
                    feather
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-neutral-400 hover:text-white"
                  }`}
                >
                  <span>Smooth Feathering</span>
                  {feather && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Blends edges gently to eliminate jagged pixels.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#10131A]">
          <div>
            {onRestoreOriginal && (
              <button
                type="button"
                onClick={handleRestore}
                className="text-xs text-neutral-400 hover:text-white underline text-left"
              >
                Keep Original Background
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isProcessing || !processedResult}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-blue-600/20"
            >
              <Check className="w-4 h-4" />
              <span>Apply Transparent Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
