"use client";

import React, { useEffect, useState } from "react";
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  FilePlus2,
  ArrowUp,
  ArrowDown,
  Layers,
} from "lucide-react";
import { PdfAnnotation, PdfPageMeta } from "@/lib/pdf/editPdf";

interface PageThumbnailsSidebarProps {
  pdfArrayBuffer: ArrayBuffer | null;
  pages: PdfPageMeta[];
  annotations: PdfAnnotation[];
  currentPageId: string;
  onSelectPage: (pageId: string) => void;
  onRotatePage: (pageId: string, delta: number) => void;
  onMovePage: (pageId: string, direction: "up" | "down") => void;
  onDuplicatePage: (pageId: string) => void;
  onInsertBlankAfter: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
}

export const PageThumbnailsSidebar: React.FC<PageThumbnailsSidebarProps> = ({
  pdfArrayBuffer,
  pages,
  annotations,
  currentPageId,
  onSelectPage,
  onRotatePage,
  onMovePage,
  onDuplicatePage,
  onInsertBlankAfter,
  onDeletePage,
}) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pdfArrayBuffer) return;
    let cancelled = false;

    const renderMissingThumbnails = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfArrayBuffer.slice(0)) });
        const pdf = await loadingTask.promise;

        for (const pageMeta of pages) {
          if (cancelled) return;
          if (pageMeta.sourceType === "blank") continue;
          const cacheKey = `${pageMeta.originalIndex}:${pageMeta.rotation}`;
          if (thumbnails[cacheKey]) continue;

          if (pageMeta.originalIndex < 0 || pageMeta.originalIndex >= pdf.numPages) continue;
          const page = await pdf.getPage(pageMeta.originalIndex + 1);
          const totalRot = ((page.rotate || 0) + pageMeta.rotation + 360) % 360;
          const viewport = page.getViewport({ scale: 0.28, rotation: totalRot });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;

          const url = canvas.toDataURL("image/jpeg", 0.78);
          setThumbnails((prev) => ({ ...prev, [cacheKey]: url }));
        }
      } catch (err) {
        console.error("Thumbnail generation error:", err);
      }
    };

    renderMissingThumbnails();
    return () => {
      cancelled = true;
    };
  }, [pdfArrayBuffer, pages]);

  return (
    <div className="flex flex-col h-full bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden shadow-subtle">
      <div className="px-3.5 py-2.5 border-b border-[#F0F0EE] flex items-center justify-between bg-[#FAFAF8]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#202124]">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pages ({pages.length})</span>
        </div>
        <button
          type="button"
          onClick={() => onInsertBlankAfter(currentPageId)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
          title="Insert blank page after current page"
        >
          <FilePlus2 className="w-3 h-3" />
          <span>+ Blank</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 max-h-[680px]">
        {pages.map((p, idx) => {
          const isSelected = p.id === currentPageId;
          const cacheKey = `${p.originalIndex}:${p.rotation}`;
          const thumbUrl = thumbnails[cacheKey];
          const annotCount = annotations.filter((a) => a.pageId === p.id).length;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPage(p.id)}
              className={`group rounded-xl border p-2 cursor-pointer transition-all ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/40 shadow-2xs"
                  : "border-[#E8E8E5] bg-white hover:border-slate-300"
              }`}
            >
              <div className="relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200/80 aspect-[3/4] flex items-center justify-center">
                {p.sourceType === "blank" ? (
                  <div className="w-full h-full bg-white flex flex-col items-center justify-center text-[10px] text-slate-400 font-mono">
                    <span>Blank Page</span>
                  </div>
                ) : thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${idx + 1}`}
                    className="w-full h-full object-contain bg-white"
                  />
                ) : (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}

                <span
                  className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-2xs ${
                    isSelected
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900/75 text-white"
                  }`}
                >
                  {idx + 1}
                </span>

                {annotCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-semibold">
                    {annotCount}
                  </span>
                )}
              </div>

              {/* Quick Page Actions */}
              <div
                className="mt-2 flex items-center justify-between gap-0.5 text-[#5F6368]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onRotatePage(p.id, -90)}
                    className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Rotate Left 90°"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRotatePage(p.id, 90)}
                    className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Rotate Right 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMovePage(p.id, "up")}
                    disabled={idx === 0}
                    className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25"
                    title="Move Page Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMovePage(p.id, "down")}
                    disabled={idx === pages.length - 1}
                    className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-25"
                    title="Move Page Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onDuplicatePage(p.id)}
                    className="p-1 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePage(p.id)}
                    disabled={pages.length <= 1}
                    className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-25"
                    title="Delete Page"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
