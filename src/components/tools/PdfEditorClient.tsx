"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileEdit,
  Upload,
  Type,
  PenTool,
  Highlighter,
  PenLine,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  X,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { ToolsLayout } from "./ToolsLayout";
import {
  applyPdfEdits,
  PdfAnnotation,
  PdfAnnotationText,
  PdfAnnotationDraw,
  PdfAnnotationRect,
  PdfAnnotationSignature,
  PdfEditState,
} from "@/lib/pdf/editPdf";

export const PdfEditorClient: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active Tool Mode: "select" | "text" | "draw" | "rect"
  const [activeTool, setActiveTool] = useState<"select" | "text" | "draw" | "rect">("text");

  // Tool settings
  const [textColor, setTextColor] = useState<string>("#1e293b");
  const [fontSize, setFontSize] = useState<number>(16);
  const [drawColor, setDrawColor] = useState<string>("#2563eb");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [rectColor, setRectColor] = useState<string>("#facc15");

  // Sign Modal state
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);

  // Edit State
  const [editState, setEditState] = useState<PdfEditState>({
    annotations: [],
    pageRotations: {},
    deletedPages: [],
  });

  const [exportedResult, setExportedResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
  } | null>(null);

  // Canvas refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  // Signature canvas ref
  const signaturePadRef = useRef<HTMLCanvasElement | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);

  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);

  // Text input placement state
  const [textInputBox, setTextInputBox] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Load PDF file
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    const buf = await file.arrayBuffer();
    setSelectedFile(file);
    setPdfArrayBuffer(buf);
    setCurrentPage(1);
    setEditState({
      annotations: [],
      pageRotations: {},
      deletedPages: [],
    });
    setExportedResult(null);

    // Load with pdfjs
    try {
      const pdfjsLib = await import("pdfjs-dist");
      if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
      const pdf = await loadingTask.promise;
      setNumPages(pdf.numPages);
      toast.success(`Loaded "${file.name}" (${pdf.numPages} pages)`);
    } catch (err: any) {
      console.error("Failed to load PDF:", err);
      toast.error("Failed to parse PDF file.");
    }

    e.target.value = "";
  };

  // Render current PDF page to canvas
  useEffect(() => {
    if (!pdfArrayBuffer || !pdfCanvasRef.current) return;

    let isCancelled = false;
    const renderPage = async () => {
      setIsRendering(true);
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer) });
        const pdf = await loadingTask.promise;

        if (isCancelled) return;
        const page = await pdf.getPage(currentPage);

        // Apply page rotation
        const userRot = editState.pageRotations[currentPage - 1] || 0;
        const viewport = page.getViewport({ scale: 1.5, rotation: userRot });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise;

        // Size overlay canvas to match
        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = viewport.width;
          overlayCanvasRef.current.height = viewport.height;
          redrawAnnotations();
        }
      } catch (err) {
        console.error("Error rendering PDF page:", err);
      } finally {
        setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
    };
  }, [pdfArrayBuffer, currentPage, editState.pageRotations]);

  // Redraw annotations on overlay canvas
  const redrawAnnotations = () => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pageIdx = currentPage - 1;
    const pageAnnots = editState.annotations.filter((a) => a.pageIndex === pageIdx);

    for (const a of pageAnnots) {
      if (a.type === "text") {
        ctx.font = `${a.fontSize * 1.5}px Helvetica, Arial, sans-serif`;
        ctx.fillStyle = a.color;
        ctx.fillText(a.text, a.x * canvas.width, a.y * canvas.height);
      } else if (a.type === "rect") {
        ctx.fillStyle = a.color;
        ctx.globalAlpha = a.opacity || 0.4;
        ctx.fillRect(
          a.x * canvas.width,
          a.y * canvas.height,
          a.width * canvas.width,
          a.height * canvas.height
        );
        ctx.globalAlpha = 1.0;
      } else if (a.type === "draw" && a.points.length > 1) {
        ctx.strokeStyle = a.color;
        ctx.lineWidth = (a.strokeWidth || 2) * 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(a.points[0].x * canvas.width, a.points[0].y * canvas.height);
        for (let i = 1; i < a.points.length; i++) {
          ctx.lineTo(a.points[i].x * canvas.width, a.points[i].y * canvas.height);
        }
        ctx.stroke();
      } else if (a.type === "signature" && a.dataUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(
            img,
            a.x * canvas.width,
            a.y * canvas.height,
            a.width * canvas.width,
            a.height * canvas.height
          );
        };
        img.src = a.dataUrl;
      }
    }
  };

  useEffect(() => {
    redrawAnnotations();
  }, [editState.annotations, currentPage]);

  // Overlay Canvas interaction handlers
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    if (activeTool === "text") {
      setTextInputBox({ x: relX, y: relY, text: "" });
    } else if (activeTool === "draw") {
      setIsDrawing(true);
      setCurrentDrawPoints([{ x: relX, y: relY }]);
    } else if (activeTool === "rect") {
      // Add a highlight box centered at tap
      const newRect: PdfAnnotationRect = {
        id: `rect-${Date.now()}`,
        type: "rect",
        pageIndex: currentPage - 1,
        x: Math.max(0, relX - 0.15),
        y: Math.max(0, relY - 0.02),
        width: 0.3,
        height: 0.04,
        color: rectColor,
        opacity: 0.4,
      };
      setEditState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newRect],
      }));
      toast.success("Highlight box added");
    }
  };

  const handleOverlayPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== "draw") return;
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    setCurrentDrawPoints((prev) => [...prev, { x: relX, y: relY }]);

    // Quick draw feedback on canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = strokeWidth * 1.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (currentDrawPoints.length > 0) {
      const last = currentDrawPoints[currentDrawPoints.length - 1];
      ctx.beginPath();
      ctx.moveTo(last.x * canvas.width, last.y * canvas.height);
      ctx.lineTo(relX * canvas.width, relY * canvas.height);
      ctx.stroke();
    }
  };

  const handleOverlayPointerUp = () => {
    if (isDrawing && currentDrawPoints.length > 1) {
      const newDraw: PdfAnnotationDraw = {
        id: `draw-${Date.now()}`,
        type: "draw",
        pageIndex: currentPage - 1,
        points: currentDrawPoints,
        color: drawColor,
        strokeWidth,
      };
      setEditState((prev) => ({
        ...prev,
        annotations: [...prev.annotations, newDraw],
      }));
    }
    setIsDrawing(false);
    setCurrentDrawPoints([]);
  };

  const handleAddTextConfirm = () => {
    if (!textInputBox || !textInputBox.text.trim()) {
      setTextInputBox(null);
      return;
    }

    const newText: PdfAnnotationText = {
      id: `text-${Date.now()}`,
      type: "text",
      pageIndex: currentPage - 1,
      x: textInputBox.x,
      y: textInputBox.y,
      text: textInputBox.text.trim(),
      fontSize,
      color: textColor,
    };

    setEditState((prev) => ({
      ...prev,
      annotations: [...prev.annotations, newText],
    }));
    setTextInputBox(null);
  };

  // Signature Pad Handlers
  const handleSignatureStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pad = signaturePadRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const ctx = pad.getContext("2d");
    if (!ctx) return;
    setIsSigning(true);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSignatureMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSigning) return;
    const pad = signaturePadRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const ctx = pad.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleSignatureEnd = () => {
    setIsSigning(false);
  };

  const handleApplySignature = () => {
    const pad = signaturePadRef.current;
    if (!pad) return;
    const dataUrl = pad.toDataURL("image/png");

    const newSig: PdfAnnotationSignature = {
      id: `sig-${Date.now()}`,
      type: "signature",
      pageIndex: currentPage - 1,
      x: 0.35,
      y: 0.8,
      width: 0.3,
      height: 0.12,
      dataUrl,
    };

    setEditState((prev) => ({
      ...prev,
      annotations: [...prev.annotations, newSig],
    }));
    setSignatureModalOpen(false);
    toast.success("Signature stamped onto page!");
  };

  // Rotate Page
  const handleRotatePage = () => {
    setEditState((prev) => ({
      ...prev,
      pageRotations: {
        ...prev.pageRotations,
        [currentPage - 1]: ((prev.pageRotations[currentPage - 1] || 0) + 90) % 360,
      },
    }));
    toast.success(`Rotated page ${currentPage}`);
  };

  // Delete Page
  const handleDeletePage = () => {
    if (numPages <= 1) {
      toast.error("Cannot delete the only page in the document.");
      return;
    }
    const pageIdx = currentPage - 1;
    setEditState((prev) => ({
      ...prev,
      deletedPages: [...prev.deletedPages, pageIdx],
    }));
    toast.success(`Page ${currentPage} marked for removal`);
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  // Export Edited PDF
  const handleExport = async () => {
    if (!pdfArrayBuffer || !selectedFile) return;

    setIsExporting(true);
    const toastId = toast.loading("Applying edits and compiling new PDF...");

    try {
      const { blob } = await applyPdfEdits(pdfArrayBuffer, editState);
      const url = URL.createObjectURL(blob);
      const originalName = selectedFile.name.replace(/\.pdf$/i, "");
      const finalName = `${originalName}-edited.pdf`;

      setExportedResult({
        blob,
        url,
        filename: finalName,
      });
      toast.success("PDF edits saved successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err?.message || "Failed to save edited PDF.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedResult) return;
    const a = document.createElement("a");
    a.href = exportedResult.url;
    a.download = exportedResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <ToolsLayout
      title="Online PDF Editor"
      subtitle="Add text, annotations, signatures, drawings, and rotate or delete pages directly in your browser. 100% free and private."
      activeTool="edit"
    >
      <div className="space-y-6">
        {/* Upload State */}
        {!selectedFile && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#10B981] bg-white rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all hover:bg-[#ECFDF5]/30 group shadow-subtle space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <FileEdit className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#202124]">
                Choose a PDF file to edit
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                Drag and drop your PDF here, or click to browse files from your device.
              </p>
            </div>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                Select PDF Document
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

        {/* PDF Editor Canvas & Toolbar */}
        {selectedFile && !exportedResult && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E8E5] shadow-subtle flex flex-wrap items-center justify-between gap-3">
              {/* Tool Selection */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTool("text")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeTool === "text"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-[#FAFAF8] text-[#5F6368] border-[#E8E8E5] hover:bg-slate-100"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("draw")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeTool === "draw"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-[#FAFAF8] text-[#5F6368] border-[#E8E8E5] hover:bg-slate-100"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Freehand Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool("rect")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    activeTool === "rect"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                      : "bg-[#FAFAF8] text-[#5F6368] border-[#E8E8E5] hover:bg-slate-100"
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>Highlight Box</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Insert Signature</span>
                </button>
              </div>

              {/* Page Controls & Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotatePage}
                  className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F5F5F3] rounded-lg border border-[#E8E8E5]"
                  title="Rotate current page 90 degrees"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleDeletePage}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                  title="Delete current page"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 bg-[#FAFAF8] px-2 py-1 rounded-lg border border-[#E8E8E5] text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-0.5 hover:text-[#202124] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold px-1">
                    {currentPage} / {numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                    disabled={currentPage >= numPages}
                    className="p-0.5 hover:text-[#202124] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? "Saving..." : "Save PDF"}</span>
                </button>
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="text-xs text-[#70757A] bg-white px-4 py-2 rounded-lg border border-[#E8E8E5] flex items-center justify-between">
              <span>
                {activeTool === "text" && "💡 Click anywhere on the document to place text."}
                {activeTool === "draw" && "💡 Click and drag to draw freehand notes or arrows."}
                {activeTool === "rect" && "💡 Click anywhere on the page to insert a highlight box."}
              </span>
              <span className="text-[11px] font-mono">
                {editState.annotations.filter((a) => a.pageIndex === currentPage - 1).length} edits on this page
              </span>
            </div>

            {/* Main Interactive Canvas Area */}
            <div
              ref={pageContainerRef}
              className="relative mx-auto bg-slate-100 p-4 sm:p-8 rounded-2xl border border-[#CBD5E1] shadow-inner overflow-x-auto flex justify-center"
            >
              <div className="relative shadow-2xl bg-white rounded-lg overflow-hidden select-none">
                {/* Background rendered PDF page */}
                <canvas ref={pdfCanvasRef} className="block max-w-full h-auto" />

                {/* Transparent Interactive Annotation Overlay Canvas */}
                <canvas
                  ref={overlayCanvasRef}
                  onPointerDown={handleOverlayPointerDown}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  className="absolute inset-0 cursor-crosshair touch-none"
                />

                {/* Floating Text Input Box when typing */}
                {textInputBox && (
                  <div
                    style={{
                      left: `${textInputBox.x * 100}%`,
                      top: `${textInputBox.y * 100}%`,
                    }}
                    className="absolute z-30 -translate-x-2 -translate-y-2 bg-white rounded-xl shadow-elevated border-2 border-emerald-500 p-2 space-y-2 min-w-[220px]"
                  >
                    <input
                      type="text"
                      autoFocus
                      value={textInputBox.text}
                      onChange={(e) =>
                        setTextInputBox({ ...textInputBox, text: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTextConfirm();
                        if (e.key === "Escape") setTextInputBox(null);
                      }}
                      placeholder="Type text here..."
                      className="w-full px-2 py-1 text-xs rounded border border-[#E8E8E5] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[#70757A]">Size:</span>
                        <select
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="px-1 py-0.5 rounded border border-[#E8E8E5] bg-white text-xs"
                        >
                          <option value="12">12</option>
                          <option value="16">16</option>
                          <option value="20">20</option>
                          <option value="24">24</option>
                          <option value="32">32</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setTextInputBox(null)}
                          className="px-2 py-0.5 rounded text-neutral-500 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddTextConfirm}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Pad Modal */}
        {signatureModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8E8E5] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0F0EE]">
                <h3 className="font-serif font-bold text-base text-[#202124] flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-purple-600" />
                  <span>Draw Your Signature</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(false)}
                  className="p-1 text-[#70757A] hover:text-[#202124]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="border border-[#CBD5E1] rounded-xl bg-slate-50 overflow-hidden relative">
                <canvas
                  ref={signaturePadRef}
                  width={380}
                  height={160}
                  onPointerDown={handleSignatureStart}
                  onPointerMove={handleSignatureMove}
                  onPointerUp={handleSignatureEnd}
                  className="w-full h-40 bg-white cursor-crosshair touch-none select-none"
                />
                <span className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono">
                  Sign above using mouse or finger
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const pad = signaturePadRef.current;
                    if (pad) {
                      const ctx = pad.getContext("2d");
                      ctx?.clearRect(0, 0, pad.width, pad.height);
                    }
                  }}
                  className="text-xs text-[#70757A] hover:underline"
                >
                  Clear Pad
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-[#70757A] hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySignature}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                  >
                    Insert on Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export Success State */}
        {exportedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-8 shadow-subtle text-center space-y-5 animate-in fade-in zoom-in-95 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-lg text-[#202124]">
                PDF Edited Successfully!
              </h3>
              <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
                All annotations, signatures, text overlays, and page changes have been compiled into your new document.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Edited PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setExportedResult(null)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#FAFAF8] hover:bg-[#F0F0EE] text-[#202124] text-xs font-semibold rounded-xl border border-[#E8E8E5] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Continue Editing</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </ToolsLayout>
  );
};
