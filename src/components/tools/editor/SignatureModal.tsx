"use client";

import React, { useState, useRef, useEffect } from "react";
import { PenLine, Type, Upload, X, Trash2, Check, Sparkles } from "lucide-react";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (dataUrl: string, aspectRatio: number) => void;
}

const PEN_COLORS = [
  { label: "Black Ink", value: "#0f172a" },
  { label: "Royal Blue", value: "#1d4ed8" },
  { label: "Navy Ink", value: "#1e3a8a" },
  { label: "Crimson", value: "#dc2626" },
];

const SIGNATURE_FONTS = [
  { id: "script", name: "Classic Script", css: "'Brush Script MT', 'Segoe Script', cursive" },
  { id: "serif", name: "Executive", css: "italic Georgia, 'Times New Roman', serif" },
  { id: "hand", name: "Handwriting", css: "'Lucida Handwriting', 'Comic Sans MS', cursive" },
  { id: "mono", name: "Architectural", css: "italic bold 'Courier New', monospace" },
];

const SAVED_SIGS_KEY = "buno_pdf_saved_signatures_v1";

function getImageAspectRatio(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width && img.height ? img.width / img.height : 2.5);
    img.onerror = () => resolve(2.5);
    img.src = dataUrl;
  });
}

function cropCanvasToContent(canvas: HTMLCanvasElement): { dataUrl: string; aspectRatio: number } | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const pad = 10;
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(width - sx, maxX - minX + 1 + pad * 2);
  const sh = Math.min(height - sy, maxY - minY + 1 + pad * 2);

  const out = document.createElement("canvas");
  out.width = sw;
  out.height = sh;
  const outCtx = out.getContext("2d")!;
  outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

  return {
    dataUrl: out.toDataURL("image/png"),
    aspectRatio: sw / Math.max(1, sh),
  };
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");
  const [penColor, setPenColor] = useState("#0f172a");
  const [penThickness, setPenThickness] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);

  // Type tab
  const [typedName, setTypedName] = useState("Waleed Ahmed");
  const [selectedFontIdx, setSelectedFontIdx] = useState(0);

  // Upload tab
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);

  // Saved signatures
  const [savedSignatures, setSavedSignatures] = useState<string[]>([]);

  const padRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem(SAVED_SIGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSavedSignatures(parsed);
      }
    } catch {
      // Ignore storage failures
    }
  }, [isOpen]);

  const saveToHistory = (dataUrl: string) => {
    try {
      const next = [dataUrl, ...savedSignatures.filter((s) => s !== dataUrl)].slice(0, 4);
      setSavedSignatures(next);
      localStorage.setItem(SAVED_SIGS_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota exceeded
    }
  };

  const handleDeleteSaved = (idx: number) => {
    const next = savedSignatures.filter((_, i) => i !== idx);
    setSavedSignatures(next);
    try {
      localStorage.setItem(SAVED_SIGS_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  // Pad drawing handlers
  const handlePadDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pad = padRef.current;
    if (!pad) return;
    pad.setPointerCapture(e.pointerId);
    const rect = pad.getBoundingClientRect();
    const scaleX = pad.width / rect.width;
    const scaleY = pad.height / rect.height;
    const ctx = pad.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penThickness * scaleX;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  };

  const handlePadMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const scaleX = pad.width / rect.width;
    const scaleY = pad.height / rect.height;
    const ctx = pad.getContext("2d");
    if (!ctx) return;
    ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const handlePadUp = () => {
    setIsDrawing(false);
  };

  const clearPad = () => {
    const pad = padRef.current;
    if (!pad) return;
    const ctx = pad.getContext("2d");
    ctx?.clearRect(0, 0, pad.width, pad.height);
  };

  // Upload processing with optional white background removal
  const processUploadedFile = (file: File, stripBg: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 700;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (stripBg) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (r > 215 && g > 215 && b > 215) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }
        setUploadedPreview(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = async () => {
    if (tab === "draw") {
      const pad = padRef.current;
      if (!pad) return;
      const cropped = cropCanvasToContent(pad);
      if (!cropped) return;
      saveToHistory(cropped.dataUrl);
      onInsert(cropped.dataUrl, cropped.aspectRatio);
      onClose();
    } else if (tab === "type") {
      if (!typedName.trim()) return;
      const canvas = document.createElement("canvas");
      canvas.width = 760;
      canvas.height = 220;
      const ctx = canvas.getContext("2d")!;
      const font = SIGNATURE_FONTS[selectedFontIdx];
      ctx.font = `68px ${font.css}`;
      ctx.fillStyle = penColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2);

      const cropped = cropCanvasToContent(canvas);
      if (!cropped) return;
      saveToHistory(cropped.dataUrl);
      onInsert(cropped.dataUrl, cropped.aspectRatio);
      onClose();
    } else if (tab === "upload" && uploadedPreview) {
      const ratio = await getImageAspectRatio(uploadedPreview);
      saveToHistory(uploadedPreview);
      onInsert(uploadedPreview, ratio);
      onClose();
    }
  };

  const handleUseSaved = async (dataUrl: string) => {
    const ratio = await getImageAspectRatio(dataUrl);
    onInsert(dataUrl, ratio);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E8E8E5] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
          <h3 className="font-serif font-bold text-base sm:text-lg text-[#202124] flex items-center gap-2">
            <PenLine className="w-4 h-4 text-purple-600" />
            <span>Signature Studio</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab("draw")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              tab === "draw"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("type")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              tab === "type"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${
              tab === "upload"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Shared Ink Color Bar (Draw & Type) */}
        {tab !== "upload" && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#70757A] font-medium">Ink Color:</span>
              <div className="flex items-center gap-1.5">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setPenColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      penColor === c.value ? "border-emerald-500 scale-115" : "border-white shadow-xs"
                    }`}
                  />
                ))}
              </div>
            </div>

            {tab === "draw" && (
              <div className="flex items-center gap-1.5">
                <span className="text-[#70757A] font-medium">Weight:</span>
                {[2, 3, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setPenThickness(w)}
                    className={`px-2 py-0.5 rounded border text-[11px] ${
                      penThickness === w
                        ? "bg-purple-50 border-purple-300 text-purple-700 font-semibold"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        {tab === "draw" && (
          <div className="border border-[#CBD5E1] rounded-xl bg-white overflow-hidden relative">
            <canvas
              ref={padRef}
              width={640}
              height={260}
              onPointerDown={handlePadDown}
              onPointerMove={handlePadMove}
              onPointerUp={handlePadUp}
              onPointerCancel={handlePadUp}
              className="w-full h-44 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] cursor-crosshair touch-none select-none"
            />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="text-[10px] text-slate-400 font-mono">
                Draw with mouse, trackpad, or finger
              </span>
              <button
                type="button"
                onClick={clearPad}
                className="pointer-events-auto text-[11px] font-medium text-slate-500 hover:text-red-600 bg-white/90 px-2 py-0.5 rounded border border-slate-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {tab === "type" && (
          <div className="space-y-3">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter your full name or initials..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <div className="grid grid-cols-2 gap-2">
              {SIGNATURE_FONTS.map((f, idx) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFontIdx(idx)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    selectedFontIdx === idx
                      ? "border-purple-500 bg-purple-50/40 ring-1 ring-purple-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div
                    style={{ fontFamily: f.css, color: penColor }}
                    className="text-xl sm:text-2xl truncate py-1"
                  >
                    {typedName || "Signature"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{f.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === "upload" && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#CBD5E1] hover:border-purple-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
            >
              {uploadedPreview ? (
                <img
                  src={uploadedPreview}
                  alt="Signature Preview"
                  className="max-h-28 mx-auto object-contain"
                />
              ) : (
                <div className="space-y-1.5">
                  <Upload className="w-6 h-6 text-purple-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-700">
                    Click to upload signature image (PNG, JPG)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    White paper photos are automatically made transparent
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processUploadedFile(file, removeWhiteBg);
                  e.target.value = "";
                }}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={removeWhiteBg}
                onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Automatically remove white paper background</span>
            </label>
          </div>
        )}

        {/* Saved Recent Signatures */}
        {savedSignatures.length > 0 && (
          <div className="pt-2 border-t border-[#F0F0EE] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Recent Signatures (Click to insert)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {savedSignatures.map((sigUrl, idx) => (
                <div
                  key={idx}
                  className="group relative border border-slate-200 rounded-lg p-1.5 bg-slate-50 hover:border-purple-400 cursor-pointer flex items-center justify-center h-12"
                  onClick={() => handleUseSaved(sigUrl)}
                >
                  <img
                    src={sigUrl}
                    alt={`Saved Signature ${idx + 1}`}
                    className="max-h-9 max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSaved(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs transition-opacity"
                    title="Remove saved signature"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F0EE]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#70757A] hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={tab === "upload" && !uploadedPreview}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-lg shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert Signature</span>
          </button>
        </div>
      </div>
    </div>
  );
};
