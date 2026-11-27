"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileEdit,
  Upload,
  MousePointer2,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  Shapes,
  PenLine,
  Image as ImageIcon,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  CheckCircle2,
  PanelLeft,
  PanelRight,
  Stamp,
  X,
  FilePlus,
} from "lucide-react";
import { toast } from "sonner";
import { ToolsLayout } from "./ToolsLayout";
import {
  applyPdfEdits,
  PdfAnnotation,
  PdfAnnotationImage,
  PdfAnnotationStamp,
  PdfEditState,
  PdfPageMeta,
} from "@/lib/pdf/editPdf";
import {
  EditorPropertiesBar,
  EditorToolMode,
  ToolDefaults,
} from "./editor/EditorPropertiesBar";
import { SignatureModal } from "./editor/SignatureModal";
import { PageThumbnailsSidebar } from "./editor/PageThumbnailsSidebar";
import { InteractiveAnnotationLayer } from "./editor/InteractiveAnnotationLayer";
import { InspectorSidebar } from "./editor/InspectorSidebar";

const DEFAULT_TOOL_SETTINGS: ToolDefaults = {
  fontFamily: "helvetica",
  fontSize: 16,
  bold: false,
  italic: false,
  align: "left",
  textColor: "#0f172a",
  textBgColor: "transparent",
  drawColor: "#2563eb",
  drawStrokeWidth: 3,
  drawOpacity: 1,
  shapeKind: "rect",
  shapeStrokeColor: "#dc2626",
  shapeFillColor: "transparent",
  shapeStrokeWidth: 2,
  shapeOpacity: 1,
};

function cloneState(state: PdfEditState): PdfEditState {
  return {
    pages: state.pages.map((p) => ({ ...p })),
    annotations: JSON.parse(JSON.stringify(state.annotations)),
  };
}

export const PdfEditorClient: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfArrayBuffer, setPdfArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // History Stack for Undo / Redo
  const [editState, setEditState] = useState<PdfEditState>({ pages: [], annotations: [] });
  const [history, setHistory] = useState<PdfEditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Active Tool & Selection
  const [activeTool, setActiveTool] = useState<EditorToolMode>("select");
  const [defaults, setDefaults] = useState<ToolDefaults>(DEFAULT_TOOL_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Viewport & Zoom
  const [zoom, setZoom] = useState<number>(1.0);
  const [pageRenderDims, setPageRenderDims] = useState<{
    widthPx: number;
    heightPx: number;
    widthPt: number;
    heightPt: number;
    renderScale: number;
  }>({
    widthPx: 600,
    heightPx: 840,
    widthPt: 595.28,
    heightPt: 841.89,
    renderScale: 1,
  });

  // Panels Visibility
  const [showLeftPanel, setShowLeftPanel] = useState<boolean>(true);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);
  const [mobileDrawer, setMobileDrawer] = useState<"none" | "pages" | "inspector">("none");
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);

  // Export Result
  const [outputFilename, setOutputFilename] = useState<string>("document-edited.pdf");
  const [exportedResult, setExportedResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    sizeBytes: number;
  } | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageUploadRef = useRef<HTMLInputElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageViewportRef = useRef<HTMLDivElement | null>(null);

  const currentPageIndex = editState.pages.findIndex((p) => p.id === currentPageId);
  const currentPageMeta = editState.pages[currentPageIndex] || null;
  const selectedAnnotation =
    editState.annotations.find((a) => a.id === selectedId) || null;

  // Commit state to undo/redo history
  const commitEditState = useCallback(
    (next: PdfEditState) => {
      const snap = cloneState(next);
      setEditState(snap);
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const appended = [...sliced, snap].slice(-50);
        setHistoryIndex(appended.length - 1);
        return appended;
      });
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prevIdx = historyIndex - 1;
    const prevSnap = cloneState(history[prevIdx]);
    setHistoryIndex(prevIdx);
    setEditState(prevSnap);
    if (prevSnap.pages.length > 0 && !prevSnap.pages.some((p) => p.id === currentPageId)) {
      setCurrentPageId(prevSnap.pages[0].id);
    }
    setSelectedId(null);
  }, [history, historyIndex, currentPageId]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const nextIdx = historyIndex + 1;
    const nextSnap = cloneState(history[nextIdx]);
    setHistoryIndex(nextIdx);
    setEditState(nextSnap);
    if (nextSnap.pages.length > 0 && !nextSnap.pages.some((p) => p.id === currentPageId)) {
      setCurrentPageId(nextSnap.pages[0].id);
    }
    setSelectedId(null);
  }, [history, historyIndex, currentPageId]);

  // Delete & Duplicate Selected
  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next: PdfEditState = {
      ...editState,
      annotations: editState.annotations.filter((a) => a.id !== selectedId),
    };
    setSelectedId(null);
    commitEditState(next);
  }, [selectedId, editState, commitEditState]);

  const handleDuplicateSelected = useCallback(() => {
    if (!selectedAnnotation) return;
    const clone: PdfAnnotation = JSON.parse(JSON.stringify(selectedAnnotation));
    clone.id = `${clone.type}-${Date.now()}`;
    if (clone.type === "draw") {
      clone.points = clone.points.map((pt) => ({
        x: Math.min(0.98, pt.x + 0.025),
        y: Math.min(0.98, pt.y + 0.025),
      }));
    } else {
      clone.x = Math.min(0.92, clone.x + 0.025);
      clone.y = Math.min(0.92, clone.y + 0.025);
    }
    const next: PdfEditState = {
      ...editState,
      annotations: [...editState.annotations, clone],
    };
    commitEditState(next);
    setSelectedId(clone.id);
    setActiveTool("select");
  }, [selectedAnnotation, editState, commitEditState]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!selectedFile || exportedResult) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (!isTyping) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (!isTyping) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        if (!isTyping && selectedId) {
          e.preventDefault();
          handleDuplicateSelected();
        }
        return;
      }

      if (isTyping) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }

      // Single-letter tool shortcuts
      const k = e.key.toLowerCase();
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (k === "v") setActiveTool("select");
        else if (k === "t") {
          setSelectedId(null);
          setActiveTool("text");
        } else if (k === "p") {
          setSelectedId(null);
          setActiveTool("draw");
        } else if (k === "h") {
          setSelectedId(null);
          setActiveTool("highlight");
        } else if (k === "w") {
          setSelectedId(null);
          setActiveTool("whiteout");
        } else if (k === "s") {
          setSelectedId(null);
          setActiveTool("shape");
        }
      }

      // Arrow keys nudge selected annotation
      if (
        selectedAnnotation &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 0.02 : 0.004;
        const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
        const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;

        const nextAnnots = editState.annotations.map((a) => {
          if (a.id !== selectedAnnotation.id) return a;
          if (a.type === "draw") {
            return {
              ...a,
              points: a.points.map((pt) => ({
                x: Math.max(0, Math.min(1, pt.x + dx)),
                y: Math.max(0, Math.min(1, pt.y + dy)),
              })),
            };
          }
          return {
            ...a,
            x: Math.max(0, Math.min(0.98, a.x + dx)),
            y: Math.max(0, Math.min(0.98, a.y + dy)),
          };
        });
        commitEditState({ ...editState, annotations: nextAnnots });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedFile,
    exportedResult,
    selectedId,
    selectedAnnotation,
    editState,
    handleUndo,
    handleRedo,
    handleDeleteSelected,
    handleDuplicateSelected,
    commitEditState,
  ]);

  // Fit-to-width helper
  const calculateFitZoom = useCallback((pageWidthPt: number) => {
    const viewportEl = stageViewportRef.current;
    const availW = viewportEl ? viewportEl.clientWidth - 48 : window.innerWidth - 48;
    const target = Math.max(0.45, Math.min(1.35, availW / Math.max(300, pageWidthPt)));
    return Math.round(target * 20) / 20;
  }, []);

  // Load PDF File
  const loadPdfFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    try {
      const buf = await file.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      }

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) });
      const pdf = await loadingTask.promise;

      const initialPages: PdfPageMeta[] = Array.from({ length: pdf.numPages }, (_, i) => ({
        id: `page-orig-${i}-${Date.now()}`,
        sourceType: "original",
        originalIndex: i,
        rotation: 0,
      }));

      const firstPage = await pdf.getPage(1);
      const vp1 = firstPage.getViewport({ scale: 1 });
      const initialZoom = calculateFitZoom(vp1.width);

      const initialState: PdfEditState = {
        pages: initialPages,
        annotations: [],
      };

      setSelectedFile(file);
      setPdfArrayBuffer(buf);
      setEditState(initialState);
      setHistory([cloneState(initialState)]);
      setHistoryIndex(0);
      setCurrentPageId(initialPages[0]?.id || "");
      setSelectedId(null);
      setZoom(initialZoom);
      setOutputFilename(`${file.name.replace(/\.pdf$/i, "")}-edited.pdf`);
      setExportedResult(null);

      toast.success(`Loaded "${file.name}" (${pdf.numPages} page${pdf.numPages > 1 ? "s" : ""})`);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast.error("Failed to parse PDF file. If encrypted, unlock it first with Password Remover.");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadPdfFile(file);
    e.target.value = "";
  };

  // Render Current Page (supports both Original and Blank pages + Retina DPR)
  useEffect(() => {
    if (!currentPageMeta || !pdfCanvasRef.current) return;
    let isCancelled = false;

    const renderPage = async () => {
      setIsRendering(true);
      try {
        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);

        if (currentPageMeta.sourceType === "blank") {
          const baseW = currentPageMeta.width || 595.28;
          const baseH = currentPageMeta.height || 841.89;
          const isSwapped =
            currentPageMeta.rotation === 90 || currentPageMeta.rotation === 270;
          const widthPt = isSwapped ? baseH : baseW;
          const heightPt = isSwapped ? baseW : baseH;

          const widthPx = Math.round(widthPt * zoom);
          const heightPx = Math.round(heightPt * zoom);

          canvas.width = Math.round(widthPx * dpr);
          canvas.height = Math.round(heightPx * dpr);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          if (!isCancelled) {
            setPageRenderDims({
              widthPx,
              heightPx,
              widthPt,
              heightPt,
              renderScale: widthPx / widthPt,
            });
          }
          return;
        }

        if (!pdfArrayBuffer) return;

        const pdfjsLib = await import("pdfjs-dist");
        if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfArrayBuffer.slice(0)),
        });
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        const page = await pdf.getPage(currentPageMeta.originalIndex + 1);
        const totalRot = ((page.rotate || 0) + currentPageMeta.rotation + 360) % 360;

        const unscaledVp = page.getViewport({ scale: 1, rotation: totalRot });
        const viewport = page.getViewport({ scale: zoom, rotation: totalRot });

        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        }).promise;

        if (!isCancelled) {
          setPageRenderDims({
            widthPx: Math.round(viewport.width),
            heightPx: Math.round(viewport.height),
            widthPt: unscaledVp.width,
            heightPt: unscaledVp.height,
            renderScale: viewport.width / unscaledVp.width,
          });
        }
      } catch (err) {
        console.error("Error rendering PDF page:", err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfArrayBuffer, currentPageMeta, zoom]);

  // Page Organizer Operations
  const handleRotatePage = (pageId: string, delta: number) => {
    const nextPages = editState.pages.map((p) =>
      p.id === pageId
        ? { ...p, rotation: ((p.rotation + delta) % 360 + 360) % 360 }
        : p
    );
    commitEditState({ ...editState, pages: nextPages });
  };

  const handleMovePage = (pageId: string, direction: "up" | "down") => {
    const idx = editState.pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= editState.pages.length) return;
    const nextPages = [...editState.pages];
    [nextPages[idx], nextPages[swapIdx]] = [nextPages[swapIdx], nextPages[idx]];
    commitEditState({ ...editState, pages: nextPages });
  };

  const handleDuplicatePage = (pageId: string) => {
    const idx = editState.pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const src = editState.pages[idx];
    const newPageId = `page-dup-${Date.now()}`;
    const newPage: PdfPageMeta = { ...src, id: newPageId };

    const clonedAnnots = editState.annotations
      .filter((a) => a.pageId === pageId)
      .map((a, i) => ({
        ...JSON.parse(JSON.stringify(a)),
        id: `${a.type}-${Date.now()}-${i}`,
        pageId: newPageId,
      }));

    const nextPages = [
      ...editState.pages.slice(0, idx + 1),
      newPage,
      ...editState.pages.slice(idx + 1),
    ];
    commitEditState({
      pages: nextPages,
      annotations: [...editState.annotations, ...clonedAnnots],
    });
    setCurrentPageId(newPageId);
    toast.success(`Duplicated page ${idx + 1}`);
  };

  const handleInsertBlankAfter = (pageId: string) => {
    const idx = editState.pages.findIndex((p) => p.id === pageId);
    const insertIdx = idx >= 0 ? idx + 1 : editState.pages.length;
    const newPageId = `page-blank-${Date.now()}`;
    const newBlank: PdfPageMeta = {
      id: newPageId,
      sourceType: "blank",
      originalIndex: -1,
      rotation: 0,
      width: pageRenderDims.widthPt || 595.28,
      height: pageRenderDims.heightPt || 841.89,
    };
    const nextPages = [
      ...editState.pages.slice(0, insertIdx),
      newBlank,
      ...editState.pages.slice(insertIdx),
    ];
    commitEditState({ ...editState, pages: nextPages });
    setCurrentPageId(newPageId);
    toast.success("Inserted blank page");
  };

  const handleDeletePage = (pageId: string) => {
    if (editState.pages.length <= 1) {
      toast.error("Document must have at least one page.");
      return;
    }
    const idx = editState.pages.findIndex((p) => p.id === pageId);
    const nextPages = editState.pages.filter((p) => p.id !== pageId);
    const nextAnnots = editState.annotations.filter((a) => a.pageId !== pageId);
    commitEditState({ pages: nextPages, annotations: nextAnnots });
    if (currentPageId === pageId) {
      const fallback = nextPages[Math.min(idx, nextPages.length - 1)];
      setCurrentPageId(fallback.id);
    }
    setSelectedId(null);
    toast.success("Page removed");
  };

  // Insert Signature / Image / Stamp
  const handleInsertSignature = (dataUrl: string, aspectRatio: number) => {
    if (!currentPageId) return;
    const width = 0.24;
    const pageAspect = pageRenderDims.widthPt / Math.max(1, pageRenderDims.heightPt);
    const height = Math.max(0.04, Math.min(0.3, (width / aspectRatio) * pageAspect));
    const id = `sig-${Date.now()}`;
    const sig: PdfAnnotationImage = {
      id,
      type: "image",
      subtype: "signature",
      pageId: currentPageId,
      x: 0.38,
      y: 0.72,
      width,
      height,
      dataUrl,
      opacity: 1,
      label: "Signature",
    };
    commitEditState({ ...editState, annotations: [...editState.annotations, sig] });
    setActiveTool("select");
    setSelectedId(id);
    toast.success("Signature placed — drag or resize anytime");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPageId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width && img.height ? img.width / img.height : 1.5;
        const pageAspect = pageRenderDims.widthPt / Math.max(1, pageRenderDims.heightPt);
        const width = 0.28;
        const height = Math.max(0.05, Math.min(0.45, (width / aspect) * pageAspect));
        const id = `img-${Date.now()}`;
        const newImg: PdfAnnotationImage = {
          id,
          type: "image",
          subtype: "image",
          pageId: currentPageId,
          x: 0.36,
          y: 0.35,
          width,
          height,
          dataUrl,
          opacity: 1,
          label: file.name.slice(0, 18),
        };
        commitEditState({ ...editState, annotations: [...editState.annotations, newImg] });
        setActiveTool("select");
        setSelectedId(id);
        setMobileDrawer("none");
        toast.success("Image inserted onto page");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleInsertStamp = (text: string, color: string, variant: "badge" | "symbol") => {
    if (!currentPageId) return;
    const id = `stamp-${Date.now()}`;
    const width = variant === "symbol" ? 0.065 : 0.22;
    const height = variant === "symbol" ? 0.048 : 0.055;
    const stamp: PdfAnnotationStamp = {
      id,
      type: "stamp",
      pageId: currentPageId,
      x: 0.5 - width / 2,
      y: 0.45,
      width,
      height,
      text,
      color,
      variant,
      opacity: 0.9,
    };
    commitEditState({ ...editState, annotations: [...editState.annotations, stamp] });
    setActiveTool("select");
    setSelectedId(id);
    setMobileDrawer("none");
    toast.success(`Inserted "${text}" stamp`);
  };

  // Property Bar Live Update
  const handleUpdateSelected = (patch: Partial<PdfAnnotation>) => {
    if (!selectedId) return;
    const nextAnnots = editState.annotations.map((a) =>
      a.id === selectedId ? ({ ...a, ...patch } as PdfAnnotation) : a
    );
    commitEditState({ ...editState, annotations: nextAnnots });
  };

  const handleLayerOrder = (direction: "front" | "back") => {
    if (!selectedId) return;
    const item = editState.annotations.find((a) => a.id === selectedId);
    if (!item) return;
    const others = editState.annotations.filter((a) => a.id !== selectedId);
    const nextAnnots = direction === "front" ? [...others, item] : [item, ...others];
    commitEditState({ ...editState, annotations: nextAnnots });
  };

  // Export Final PDF
  const handleExport = async () => {
    if (!pdfArrayBuffer || !selectedFile) return;

    setIsExporting(true);
    const toastId = toast.loading("Compiling edited PDF document...");

    try {
      const { blob } = await applyPdfEdits(pdfArrayBuffer, editState);
      const url = URL.createObjectURL(blob);
      const cleanName = outputFilename.trim()
        ? outputFilename.trim().endsWith(".pdf")
          ? outputFilename.trim()
          : `${outputFilename.trim()}.pdf`
        : `${selectedFile.name.replace(/\.pdf$/i, "")}-edited.pdf`;

      setExportedResult({
        blob,
        url,
        filename: cleanName,
        sizeBytes: blob.size,
      });
      toast.success("Edited PDF ready for download!", { id: toastId });
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err?.message || "Failed to compile edited PDF.", { id: toastId });
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

  const selectTool = (mode: EditorToolMode) => {
    if (mode !== "select") setSelectedId(null);
    setActiveTool(mode);
  };

  const totalEditCount = editState.annotations.length;

  return (
    <ToolsLayout
      title="Advanced PDF Studio"
      subtitle="Full-featured PDF editor: rich formatting text, vector shapes, whiteout & redaction, signatures, business stamps, page organizer, zoom & undo history."
      activeTool="edit"
      wide={Boolean(selectedFile && !exportedResult)}
      hideHeader={Boolean(selectedFile && !exportedResult)}
    >
      <div className="space-y-4">
        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={imageUploadRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Upload Dropzone State */}
        {!selectedFile && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) loadPdfFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#10B981] bg-white rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all hover:bg-[#ECFDF5]/30 group shadow-subtle space-y-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <FileEdit className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base sm:text-xl text-[#202124]">
                Open a PDF in Studio Editor
              </h3>
              <p className="text-xs sm:text-sm text-[#70757A] mt-1.5 max-w-md mx-auto">
                Drag and drop any PDF file here, or click to select from your device. Everything executes locally in your browser.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto text-[11px] font-medium text-slate-600">
              {[
                "Rich Text & Fonts",
                "Move & Resize Handles",
                "Whiteout & Redact",
                "Arrows & Shapes",
                "Draw / Type / Upload Signature",
                "Page Reorder & Blank Pages",
                "Undo / Redo",
              ].map((feat) => (
                <span
                  key={feat}
                  className="px-2.5 py-1 rounded-full bg-[#FAFAF8] border border-[#E8E8E5]"
                >
                  {feat}
                </span>
              ))}
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors">
                <Upload className="w-4 h-4" />
                Select PDF Document
              </span>
            </div>
          </div>
        )}

        {/* Active Studio Workspace */}
        {selectedFile && !exportedResult && (
          <div className="space-y-2.5">
            {/* Primary Studio Toolbar */}
            <div className="bg-white px-3 py-2.5 rounded-2xl border border-[#E8E8E5] shadow-subtle flex flex-wrap items-center justify-between gap-2">
              {/* Left: File + Panel Toggles + Undo/Redo */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setMobileDrawer((d) => (d === "pages" ? "none" : "pages"));
                    } else {
                      setShowLeftPanel((v) => !v);
                    }
                  }}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    showLeftPanel
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-[#E8E8E5] text-[#5F6368] hover:bg-slate-50"
                  }`}
                  title="Toggle Pages Panel"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-[#E8E8E5] rounded-lg overflow-hidden bg-[#FAFAF8]">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 border-l border-[#E8E8E5] text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8E8E5] text-[11px] font-medium text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"
                  title="Open different PDF"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
              </div>

              {/* Center: Tool Palette */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full py-0.5">
                {[
                  { id: "select" as const, label: "Select", Icon: MousePointer2, key: "V" },
                  { id: "text" as const, label: "Text", Icon: Type, key: "T" },
                  { id: "draw" as const, label: "Pen", Icon: PenTool, key: "P" },
                  { id: "highlight" as const, label: "Highlight", Icon: Highlighter, key: "H" },
                  { id: "whiteout" as const, label: "Whiteout", Icon: Eraser, key: "W" },
                  { id: "shape" as const, label: "Shapes", Icon: Shapes, key: "S" },
                ].map(({ id, label, Icon, key }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectTool(id)}
                    title={`${label} (${key})`}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border shrink-0 transition-all ${
                      activeTool === id
                        ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs"
                        : "bg-[#FAFAF8] text-[#5F6368] border-[#E8E8E5] hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setSignatureModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 shrink-0 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Sign</span>
                </button>

                <button
                  type="button"
                  onClick={() => imageUploadRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 shrink-0 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Image</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setMobileDrawer((d) => (d === "inspector" ? "none" : "inspector"))
                  }
                  className="xl:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 shrink-0 transition-colors"
                >
                  <Stamp className="w-3.5 h-3.5" />
                  <span>Stamps</span>
                </button>
              </div>

              {/* Right: Zoom + Inspector Toggle + Save */}
              <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                <div className="flex items-center bg-[#FAFAF8] border border-[#E8E8E5] rounded-lg overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 20) / 20))}
                    className="p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <select
                    value={Math.round(zoom * 100)}
                    onChange={(e) => setZoom(Number(e.target.value) / 100)}
                    className="bg-transparent px-1 py-1 font-mono text-[11px] font-semibold focus:outline-none cursor-pointer"
                  >
                    {[50, 75, 90, 100, 125, 150, 200, 250].map((pct) => (
                      <option key={pct} value={pct}>
                        {pct}%
                      </option>
                    ))}
                    {![50, 75, 90, 100, 125, 150, 200, 250].includes(Math.round(zoom * 100)) && (
                      <option value={Math.round(zoom * 100)}>{Math.round(zoom * 100)}%</option>
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 20) / 20))}
                    className="p-1.5 text-slate-600 hover:bg-slate-100"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoom(calculateFitZoom(pageRenderDims.widthPt))}
                    className="p-1.5 border-l border-[#E8E8E5] text-slate-600 hover:bg-slate-100"
                    title="Fit Page Width"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRightPanel((v) => !v)}
                  className={`hidden xl:inline-flex p-2 rounded-lg border text-xs transition-colors ${
                    showRightPanel
                      ? "bg-slate-100 border-slate-300 text-slate-900"
                      : "bg-white border-[#E8E8E5] text-[#5F6368] hover:bg-slate-50"
                  }`}
                  title="Toggle Stamps & Layers Panel"
                >
                  <PanelRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? "Saving..." : "Save PDF"}</span>
                </button>
              </div>
            </div>

            {/* Contextual Tool / Selection Properties Bar */}
            <EditorPropertiesBar
              activeTool={activeTool}
              defaults={defaults}
              onUpdateDefaults={(patch) => setDefaults((d) => ({ ...d, ...patch }))}
              selectedAnnotation={selectedAnnotation}
              onUpdateSelected={handleUpdateSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onDeleteSelected={handleDeleteSelected}
              onLayerOrder={handleLayerOrder}
            />

            {/* 3-Pane Editor Layout */}
            <div className="flex items-start gap-3">
              {/* Left Sidebar: Desktop Page Thumbnails */}
              {showLeftPanel && (
                <aside className="hidden lg:block w-52 shrink-0 sticky top-20">
                  <PageThumbnailsSidebar
                    pdfArrayBuffer={pdfArrayBuffer}
                    pages={editState.pages}
                    annotations={editState.annotations}
                    currentPageId={currentPageId}
                    onSelectPage={(pid) => {
                      setCurrentPageId(pid);
                      setSelectedId(null);
                    }}
                    onRotatePage={handleRotatePage}
                    onMovePage={handleMovePage}
                    onDuplicatePage={handleDuplicatePage}
                    onInsertBlankAfter={handleInsertBlankAfter}
                    onDeletePage={handleDeletePage}
                  />
                </aside>
              )}

              {/* Center Interactive Canvas Stage */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div
                  ref={stageViewportRef}
                  className="relative bg-slate-200/80 rounded-2xl border border-[#CBD5E1] shadow-inner overflow-auto min-h-[540px] max-h-[75vh] p-3 sm:p-6 flex justify-center items-start"
                >
                  {isRendering && (
                    <div className="absolute top-3 right-3 z-40 px-2.5 py-1 rounded-full bg-slate-900/75 text-white text-[10px] font-mono">
                      Rendering…
                    </div>
                  )}

                  <div
                    style={{
                      width: `${pageRenderDims.widthPx}px`,
                      height: `${pageRenderDims.heightPx}px`,
                    }}
                    className="relative shrink-0 shadow-2xl bg-white rounded-sm overflow-hidden"
                  >
                    <canvas
                      ref={pdfCanvasRef}
                      style={{
                        width: `${pageRenderDims.widthPx}px`,
                        height: `${pageRenderDims.heightPx}px`,
                      }}
                      className="block"
                    />

                    <InteractiveAnnotationLayer
                      pageId={currentPageId}
                      pageWidthPx={pageRenderDims.widthPx}
                      pageHeightPx={pageRenderDims.heightPx}
                      renderScale={pageRenderDims.renderScale}
                      activeTool={activeTool}
                      defaults={defaults}
                      annotations={editState.annotations}
                      selectedId={selectedId}
                      onSelect={setSelectedId}
                      onAddAnnotation={(annot) =>
                        commitEditState({
                          ...editState,
                          annotations: [...editState.annotations, annot],
                        })
                      }
                      onLiveUpdateAnnotations={(nextAnnots) =>
                        setEditState({ ...editState, annotations: nextAnnots })
                      }
                      onCommitAnnotations={(nextAnnots) =>
                        commitEditState({ ...editState, annotations: nextAnnots })
                      }
                    />
                  </div>
                </div>

                {/* Bottom Status & Page Pagination */}
                <div className="bg-white px-4 py-2 rounded-xl border border-[#E8E8E5] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#5F6368]">
                    <span className="font-semibold text-[#202124] truncate max-w-[180px] sm:max-w-xs">
                      {selectedFile.name}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {totalEditCount} total edit{totalEditCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#FAFAF8] px-2.5 py-1 rounded-lg border border-[#E8E8E5] font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPageIndex > 0) {
                          setCurrentPageId(editState.pages[currentPageIndex - 1].id);
                          setSelectedId(null);
                        }
                      }}
                      disabled={currentPageIndex <= 0}
                      className="p-0.5 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold px-1.5 text-[11px]">
                      Page {currentPageIndex + 1} / {editState.pages.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentPageIndex < editState.pages.length - 1) {
                          setCurrentPageId(editState.pages[currentPageIndex + 1].id);
                          setSelectedId(null);
                        }
                      }}
                      disabled={currentPageIndex >= editState.pages.length - 1}
                      className="p-0.5 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Stamps, Images & Page Layers */}
              {showRightPanel && (
                <aside className="hidden xl:block w-64 shrink-0 sticky top-20">
                  <InspectorSidebar
                    annotations={editState.annotations}
                    currentPageId={currentPageId}
                    selectedId={selectedId}
                    onSelectAnnotation={(id) => {
                      setActiveTool("select");
                      setSelectedId(id);
                    }}
                    onDeleteAnnotation={(id) => {
                      if (selectedId === id) setSelectedId(null);
                      commitEditState({
                        ...editState,
                        annotations: editState.annotations.filter((a) => a.id !== id),
                      });
                    }}
                    onInsertStamp={handleInsertStamp}
                    onTriggerImageUpload={() => imageUploadRef.current?.click()}
                  />
                </aside>
              )}
            </div>
          </div>
        )}

        {/* Mobile / Tablet Slide-Over Drawer for Pages & Inspector */}
        {mobileDrawer !== "none" && selectedFile && !exportedResult && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
            <div className="bg-[#FAFAF8] w-full max-w-xs h-full p-4 flex flex-col gap-3 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E5]">
                <span className="font-serif font-bold text-sm text-[#202124]">
                  {mobileDrawer === "pages" ? "Organize Pages" : "Stamps & Page Layers"}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileDrawer("none")}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {mobileDrawer === "pages" ? (
                <PageThumbnailsSidebar
                  pdfArrayBuffer={pdfArrayBuffer}
                  pages={editState.pages}
                  annotations={editState.annotations}
                  currentPageId={currentPageId}
                  onSelectPage={(pid) => {
                    setCurrentPageId(pid);
                    setSelectedId(null);
                    setMobileDrawer("none");
                  }}
                  onRotatePage={handleRotatePage}
                  onMovePage={handleMovePage}
                  onDuplicatePage={handleDuplicatePage}
                  onInsertBlankAfter={handleInsertBlankAfter}
                  onDeletePage={handleDeletePage}
                />
              ) : (
                <InspectorSidebar
                  annotations={editState.annotations}
                  currentPageId={currentPageId}
                  selectedId={selectedId}
                  onSelectAnnotation={(id) => {
                    setActiveTool("select");
                    setSelectedId(id);
                    setMobileDrawer("none");
                  }}
                  onDeleteAnnotation={(id) => {
                    if (selectedId === id) setSelectedId(null);
                    commitEditState({
                      ...editState,
                      annotations: editState.annotations.filter((a) => a.id !== id),
                    });
                  }}
                  onInsertStamp={handleInsertStamp}
                  onTriggerImageUpload={() => imageUploadRef.current?.click()}
                />
              )}
            </div>
          </div>
        )}

        {/* Enhanced Signature Studio Modal */}
        <SignatureModal
          isOpen={signatureModalOpen}
          onClose={() => setSignatureModalOpen(false)}
          onInsert={handleInsertSignature}
        />

        {/* Export Success State */}
        {exportedResult && (
          <div className="bg-white rounded-2xl border border-[#E8E8E5] p-6 sm:p-8 shadow-subtle text-center space-y-5 animate-in fade-in zoom-in-95 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-lg text-[#202124]">
                PDF Compiled Successfully!
              </h3>
              <p className="text-xs text-[#70757A] max-w-sm mx-auto">
                {editState.pages.length} page{editState.pages.length === 1 ? "" : "s"} •{" "}
                {editState.annotations.length} edit{editState.annotations.length === 1 ? "" : "s"} •{" "}
                {(exportedResult.sizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>

            <div className="text-left max-w-xs mx-auto space-y-1">
              <label className="text-[11px] font-medium text-[#5F6368]">File Name</label>
              <input
                type="text"
                value={exportedResult.filename}
                onChange={(e) =>
                  setExportedResult({ ...exportedResult, filename: e.target.value })
                }
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
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

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setPdfArrayBuffer(null);
                setExportedResult(null);
              }}
              className="text-[11px] text-[#70757A] hover:text-[#202124] underline"
            >
              Open a different PDF
            </button>
          </div>
        )}
      </div>
    </ToolsLayout>
  );
};
