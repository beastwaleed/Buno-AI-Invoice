"use client";

import React from "react";
import {
  Stamp,
  Image as ImageIcon,
  Type,
  PenTool,
  Shapes,
  PenLine,
  Trash2,
  Layers,
  Check,
  X,
} from "lucide-react";
import { PdfAnnotation } from "@/lib/pdf/editPdf";

interface InspectorSidebarProps {
  annotations: PdfAnnotation[];
  currentPageId: string;
  selectedId: string | null;
  onSelectAnnotation: (id: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onInsertStamp: (text: string, color: string, variant: "badge" | "symbol") => void;
  onTriggerImageUpload: () => void;
}

const PRESET_STAMPS: { text: string; color: string; variant: "badge" | "symbol" }[] = [
  { text: "APPROVED", color: "#059669", variant: "badge" },
  { text: "PAID", color: "#2563eb", variant: "badge" },
  { text: "CONFIDENTIAL", color: "#dc2626", variant: "badge" },
  { text: "DRAFT", color: "#d97706", variant: "badge" },
  { text: "VOID", color: "#475569", variant: "badge" },
  { text: "URGENT", color: "#ea580c", variant: "badge" },
];

function describeAnnotation(a: PdfAnnotation): { label: string; Icon: React.ElementType } {
  if (a.type === "text") {
    const preview = a.text.replace(/\s+/g, " ").slice(0, 22);
    return { label: `Text: ${preview}${a.text.length > 22 ? "…" : ""}`, Icon: Type };
  }
  if (a.type === "draw") {
    return { label: "Freehand Stroke", Icon: PenTool };
  }
  if (a.type === "stamp") {
    return { label: `Stamp: ${a.text}`, Icon: Stamp };
  }
  if (a.type === "image") {
    return {
      label: a.subtype === "signature" ? "Signature" : a.label || "Image",
      Icon: a.subtype === "signature" ? PenLine : ImageIcon,
    };
  }
  const shapeNames: Record<string, string> = {
    rect: "Rectangle",
    circle: "Circle / Ellipse",
    highlight: "Highlight",
    whiteout: "Whiteout",
    redact: "Redaction Box",
    line: "Line",
    arrow: "Arrow",
  };
  return { label: shapeNames[a.shapeType] || "Shape", Icon: Shapes };
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  annotations,
  currentPageId,
  selectedId,
  onSelectAnnotation,
  onDeleteAnnotation,
  onInsertStamp,
  onTriggerImageUpload,
}) => {
  const pageAnnots = annotations.filter((a) => a.pageId === currentPageId);
  const reversed = [...pageAnnots].reverse();

  return (
    <div className="flex flex-col gap-3">
      {/* Stamps & Media Card */}
      <div className="bg-white border border-[#E8E8E5] rounded-2xl p-3.5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
            <Stamp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stamps & Media</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onTriggerImageUpload}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-[#CBD5E1] hover:border-emerald-500 hover:bg-emerald-50/40 text-xs font-semibold text-[#202124] transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Insert Image / Logo</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_STAMPS.map((s) => (
            <button
              key={s.text}
              type="button"
              onClick={() => onInsertStamp(s.text, s.color, "badge")}
              style={{
                borderColor: s.color,
                color: s.color,
                backgroundColor: `${s.color}0D`,
              }}
              className="px-2 py-1 rounded-md border-[1.5px] text-[10px] font-black tracking-wider uppercase hover:opacity-80 transition-opacity truncate"
            >
              {s.text}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => onInsertStamp("✓", "#059669", "symbol")}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-700 hover:bg-emerald-100 text-xs font-bold"
            title="Insert Checkmark"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Check</span>
          </button>
          <button
            type="button"
            onClick={() => onInsertStamp("✕", "#dc2626", "symbol")}
            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg border border-red-200 bg-red-50/60 text-red-700 hover:bg-red-100 text-xs font-bold"
            title="Insert Cross Mark"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cross</span>
          </button>
        </div>
      </div>

      {/* Layers Card */}
      <div className="bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden shadow-subtle flex flex-col">
        <div className="px-3.5 py-2.5 border-b border-[#F0F0EE] bg-[#FAFAF8] flex items-center justify-between">
          <span className="text-xs font-bold text-[#202124] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Page Layers ({pageAnnots.length})</span>
          </span>
        </div>

        {reversed.length === 0 ? (
          <div className="p-4 text-center text-[11px] text-[#9AA0A6]">
            No edits added on this page yet.
          </div>
        ) : (
          <div className="divide-y divide-[#F0F0EE] max-h-[320px] overflow-y-auto">
            {reversed.map((a) => {
              const { label, Icon } = describeAnnotation(a);
              const isSelected = a.id === selectedId;
              return (
                <div
                  key={a.id}
                  onClick={() => onSelectAnnotation(a.id)}
                  className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-900 font-semibold"
                      : "hover:bg-slate-50 text-[#5F6368]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="w-3.5 h-3.5 shrink-0 opacity-75" />
                    <span className="truncate">{label}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(a.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded shrink-0"
                    title="Delete element"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
