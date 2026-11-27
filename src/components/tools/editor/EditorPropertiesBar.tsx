"use client";

import React from "react";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Highlighter,
  Eraser,
  EyeOff,
} from "lucide-react";
import { PdfAnnotation, PdfShapeKind } from "@/lib/pdf/editPdf";

export type EditorToolMode =
  | "select"
  | "text"
  | "draw"
  | "highlight"
  | "whiteout"
  | "shape";

export interface ToolDefaults {
  fontFamily: "helvetica" | "times" | "courier";
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  textColor: string;
  textBgColor: string;
  drawColor: string;
  drawStrokeWidth: number;
  drawOpacity: number;
  shapeKind: PdfShapeKind;
  shapeStrokeColor: string;
  shapeFillColor: string;
  shapeStrokeWidth: number;
  shapeOpacity: number;
}

interface EditorPropertiesBarProps {
  activeTool: EditorToolMode;
  defaults: ToolDefaults;
  onUpdateDefaults: (patch: Partial<ToolDefaults>) => void;
  selectedAnnotation: PdfAnnotation | null;
  onUpdateSelected: (patch: Partial<PdfAnnotation>) => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onLayerOrder: (direction: "front" | "back") => void;
}

const QUICK_COLORS = [
  "#0f172a",
  "#dc2626",
  "#2563eb",
  "#059669",
  "#d97706",
  "#7c3aed",
  "#ffffff",
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#facc15" },
  { label: "Green", value: "#4ade80" },
  { label: "Blue", value: "#60a5fa" },
  { label: "Pink", value: "#f472b6" },
  { label: "Orange", value: "#fb923c" },
];

export const EditorPropertiesBar: React.FC<EditorPropertiesBarProps> = ({
  activeTool,
  defaults,
  onUpdateDefaults,
  selectedAnnotation,
  onUpdateSelected,
  onDuplicateSelected,
  onDeleteSelected,
  onLayerOrder,
}) => {
  const showTextControls =
    selectedAnnotation?.type === "text" || (!selectedAnnotation && activeTool === "text");
  const showDrawControls =
    selectedAnnotation?.type === "draw" || (!selectedAnnotation && activeTool === "draw");
  const showShapeControls =
    selectedAnnotation?.type === "shape" ||
    (!selectedAnnotation &&
      (activeTool === "shape" || activeTool === "highlight" || activeTool === "whiteout"));
  const showImageOrStampControls =
    selectedAnnotation?.type === "image" || selectedAnnotation?.type === "stamp";

  if (
    !showTextControls &&
    !showDrawControls &&
    !showShapeControls &&
    !showImageOrStampControls
  ) {
    return (
      <div className="bg-[#FAFAF8] px-3.5 py-2 rounded-xl border border-[#E8E8E5] text-[11px] text-[#70757A] flex items-center justify-between flex-wrap gap-2">
        <span>
          Click any element on the page to select, move, resize, or double-click text to edit inline.
        </span>
        <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
          Shortcuts: V Select • T Text • P Pen • H Highlight • W Whiteout • Del Remove
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white px-3 py-2 rounded-xl border border-[#E8E8E5] shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        {/* TEXT PROPERTIES */}
        {showTextControls && (
          <>
            <select
              value={
                selectedAnnotation?.type === "text"
                  ? selectedAnnotation.fontFamily
                  : defaults.fontFamily
              }
              onChange={(e) => {
                const val = e.target.value as "helvetica" | "times" | "courier";
                if (selectedAnnotation?.type === "text") {
                  onUpdateSelected({ fontFamily: val });
                } else {
                  onUpdateDefaults({ fontFamily: val });
                }
              }}
              className="px-2 py-1 rounded-lg border border-[#E8E8E5] bg-[#FAFAF8] text-xs font-medium focus:outline-none"
            >
              <option value="helvetica">Sans (Helvetica)</option>
              <option value="times">Serif (Times)</option>
              <option value="courier">Mono (Courier)</option>
            </select>

            <select
              value={
                selectedAnnotation?.type === "text"
                  ? selectedAnnotation.fontSize
                  : defaults.fontSize
              }
              onChange={(e) => {
                const val = Number(e.target.value);
                if (selectedAnnotation?.type === "text") {
                  onUpdateSelected({ fontSize: val });
                } else {
                  onUpdateDefaults({ fontSize: val });
                }
              }}
              className="px-2 py-1 rounded-lg border border-[#E8E8E5] bg-[#FAFAF8] text-xs font-mono"
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}pt
                </option>
              ))}
            </select>

            <div className="flex items-center border border-[#E8E8E5] rounded-lg overflow-hidden bg-[#FAFAF8]">
              <button
                type="button"
                onClick={() => {
                  const next = !(
                    selectedAnnotation?.type === "text"
                      ? selectedAnnotation.bold
                      : defaults.bold
                  );
                  if (selectedAnnotation?.type === "text") onUpdateSelected({ bold: next });
                  else onUpdateDefaults({ bold: next });
                }}
                className={`p-1.5 ${
                  (selectedAnnotation?.type === "text" ? selectedAnnotation.bold : defaults.bold)
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !(
                    selectedAnnotation?.type === "text"
                      ? selectedAnnotation.italic
                      : defaults.italic
                  );
                  if (selectedAnnotation?.type === "text") onUpdateSelected({ italic: next });
                  else onUpdateDefaults({ italic: next });
                }}
                className={`p-1.5 border-l border-[#E8E8E5] ${
                  (selectedAnnotation?.type === "text"
                    ? selectedAnnotation.italic
                    : defaults.italic)
                    ? "bg-emerald-100 text-emerald-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center border border-[#E8E8E5] rounded-lg overflow-hidden bg-[#FAFAF8]">
              {(["left", "center", "right"] as const).map((al) => {
                const activeAlign =
                  selectedAnnotation?.type === "text"
                    ? selectedAnnotation.align || "left"
                    : defaults.align;
                const Icon =
                  al === "left" ? AlignLeft : al === "center" ? AlignCenter : AlignRight;
                return (
                  <button
                    key={al}
                    type="button"
                    onClick={() => {
                      if (selectedAnnotation?.type === "text") onUpdateSelected({ align: al });
                      else onUpdateDefaults({ align: al });
                    }}
                    className={`p-1.5 ${al !== "left" ? "border-l border-[#E8E8E5]" : ""} ${
                      activeAlign === al
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title={`Align ${al}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-1 pl-1 border-l border-[#E8E8E5]">
              <span className="text-[11px] text-[#70757A]">Color:</span>
              <input
                type="color"
                value={
                  selectedAnnotation?.type === "text"
                    ? selectedAnnotation.color
                    : defaults.textColor
                }
                onChange={(e) => {
                  if (selectedAnnotation?.type === "text") {
                    onUpdateSelected({ color: e.target.value });
                  } else {
                    onUpdateDefaults({ textColor: e.target.value });
                  }
                }}
                className="w-6 h-6 rounded cursor-pointer border border-slate-200 p-0 bg-transparent"
                title="Text color"
              />
            </div>

            {/* Text Background (Transparent or Whiteout) */}
            <div className="flex items-center gap-1 pl-1 border-l border-[#E8E8E5]">
              <span className="text-[11px] text-[#70757A]">Fill:</span>
              <button
                type="button"
                onClick={() => {
                  const cur =
                    selectedAnnotation?.type === "text"
                      ? selectedAnnotation.backgroundColor
                      : defaults.textBgColor;
                  const next = cur === "#ffffff" ? "transparent" : "#ffffff";
                  if (selectedAnnotation?.type === "text") {
                    onUpdateSelected({ backgroundColor: next });
                  } else {
                    onUpdateDefaults({ textBgColor: next });
                  }
                }}
                className={`px-2 py-1 rounded-md border text-[11px] font-medium ${
                  (selectedAnnotation?.type === "text"
                    ? selectedAnnotation.backgroundColor
                    : defaults.textBgColor) === "#ffffff"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                    : "bg-[#FAFAF8] border-[#E8E8E5] text-slate-600"
                }`}
                title="Toggle solid white backdrop behind text"
              >
                White Backdrop
              </button>
            </div>
          </>
        )}

        {/* DRAW PROPERTIES */}
        {showDrawControls && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#70757A] font-medium">Pen:</span>
              {QUICK_COLORS.slice(0, 6).map((c) => {
                const cur =
                  selectedAnnotation?.type === "draw"
                    ? selectedAnnotation.color
                    : defaults.drawColor;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (selectedAnnotation?.type === "draw") onUpdateSelected({ color: c });
                      else onUpdateDefaults({ drawColor: c });
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border-2 ${
                      cur === c ? "border-emerald-500 scale-110" : "border-white shadow-xs"
                    }`}
                  />
                );
              })}
              <input
                type="color"
                value={
                  selectedAnnotation?.type === "draw"
                    ? selectedAnnotation.color
                    : defaults.drawColor
                }
                onChange={(e) => {
                  if (selectedAnnotation?.type === "draw") {
                    onUpdateSelected({ color: e.target.value });
                  } else {
                    onUpdateDefaults({ drawColor: e.target.value });
                  }
                }}
                className="w-6 h-6 rounded cursor-pointer border border-slate-200 bg-transparent"
              />
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-[#E8E8E5]">
              <span className="text-[11px] text-[#70757A]">Thickness:</span>
              <input
                type="range"
                min={1}
                max={14}
                value={
                  selectedAnnotation?.type === "draw"
                    ? selectedAnnotation.strokeWidth
                    : defaults.drawStrokeWidth
                }
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (selectedAnnotation?.type === "draw") {
                    onUpdateSelected({ strokeWidth: val });
                  } else {
                    onUpdateDefaults({ drawStrokeWidth: val });
                  }
                }}
                className="w-20 accent-emerald-600"
              />
              <span className="font-mono text-[11px] w-7">
                {selectedAnnotation?.type === "draw"
                  ? selectedAnnotation.strokeWidth
                  : defaults.drawStrokeWidth}
                px
              </span>
            </div>
          </>
        )}

        {/* SHAPE / HIGHLIGHT / WHITEOUT PROPERTIES */}
        {showShapeControls && (
          <>
            {!selectedAnnotation && activeTool === "shape" && (
              <div className="flex items-center gap-1 pr-2 border-r border-[#E8E8E5]">
                {(
                  [
                    { kind: "rect", label: "Rectangle", Icon: Square },
                    { kind: "circle", label: "Circle", Icon: Circle },
                    { kind: "line", label: "Line", Icon: Minus },
                    { kind: "arrow", label: "Arrow", Icon: ArrowUpRight },
                    { kind: "redact", label: "Redact", Icon: EyeOff },
                  ] as const
                ).map(({ kind, label, Icon }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      if (kind === "redact") {
                        onUpdateDefaults({
                          shapeKind: "redact",
                          shapeFillColor: "#0f172a",
                          shapeStrokeColor: "#0f172a",
                          shapeStrokeWidth: 0,
                          shapeOpacity: 1,
                        });
                      } else if (kind === "line" || kind === "arrow") {
                        onUpdateDefaults({
                          shapeKind: kind,
                          shapeFillColor: "transparent",
                          shapeStrokeWidth: Math.max(2, defaults.shapeStrokeWidth),
                          shapeOpacity: 1,
                        });
                      } else {
                        onUpdateDefaults({
                          shapeKind: kind,
                          shapeOpacity: 1,
                          shapeStrokeWidth: Math.max(2, defaults.shapeStrokeWidth),
                        });
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${
                      defaults.shapeKind === kind
                        ? "bg-emerald-50 border-emerald-400 text-emerald-800"
                        : "bg-[#FAFAF8] border-[#E8E8E5] text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Highlight Quick Swatches */}
            {(activeTool === "highlight" ||
              (selectedAnnotation?.type === "shape" &&
                selectedAnnotation.shapeType === "highlight")) && (
              <div className="flex items-center gap-1.5">
                <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] text-[#70757A]">Marker:</span>
                {HIGHLIGHT_COLORS.map((hc) => {
                  const cur =
                    selectedAnnotation?.type === "shape"
                      ? selectedAnnotation.fillColor
                      : defaults.shapeFillColor;
                  return (
                    <button
                      key={hc.value}
                      type="button"
                      title={hc.label}
                      onClick={() => {
                        if (selectedAnnotation?.type === "shape") {
                          onUpdateSelected({ fillColor: hc.value });
                        } else {
                          onUpdateDefaults({ shapeFillColor: hc.value });
                        }
                      }}
                      style={{ backgroundColor: hc.value }}
                      className={`w-5 h-5 rounded-full border-2 ${
                        cur === hc.value ? "border-slate-900 scale-110" : "border-white shadow-xs"
                      }`}
                    />
                  );
                })}
              </div>
            )}

            {/* Whiteout info */}
            {(activeTool === "whiteout" ||
              (selectedAnnotation?.type === "shape" &&
                selectedAnnotation.shapeType === "whiteout")) && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <Eraser className="w-3.5 h-3.5 text-slate-500" />
                <span>Drag across PDF content to cover cleanly with solid fill</span>
              </div>
            )}

            {/* Stroke & Fill for regular shapes */}
            {!(
              activeTool === "highlight" ||
              activeTool === "whiteout" ||
              (selectedAnnotation?.type === "shape" &&
                (selectedAnnotation.shapeType === "highlight" ||
                  selectedAnnotation.shapeType === "whiteout"))
            ) && (
              <>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-[#70757A]">Stroke:</span>
                  <input
                    type="color"
                    value={
                      selectedAnnotation?.type === "shape"
                        ? selectedAnnotation.strokeColor
                        : defaults.shapeStrokeColor
                    }
                    onChange={(e) => {
                      if (selectedAnnotation?.type === "shape") {
                        onUpdateSelected({ strokeColor: e.target.value });
                      } else {
                        onUpdateDefaults({ shapeStrokeColor: e.target.value });
                      }
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-200 bg-transparent"
                  />
                </div>

                {(selectedAnnotation?.type === "shape"
                  ? selectedAnnotation.shapeType !== "line" &&
                    selectedAnnotation.shapeType !== "arrow"
                  : defaults.shapeKind !== "line" && defaults.shapeKind !== "arrow") && (
                  <div className="flex items-center gap-1 pl-1 border-l border-[#E8E8E5]">
                    <span className="text-[11px] text-[#70757A]">Fill:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur =
                          selectedAnnotation?.type === "shape"
                            ? selectedAnnotation.fillColor
                            : defaults.shapeFillColor;
                        const next = cur === "transparent" ? "#eff6ff" : "transparent";
                        if (selectedAnnotation?.type === "shape") {
                          onUpdateSelected({ fillColor: next });
                        } else {
                          onUpdateDefaults({ shapeFillColor: next });
                        }
                      }}
                      className="px-2 py-0.5 rounded border border-[#E8E8E5] bg-[#FAFAF8] text-[11px]"
                    >
                      {(selectedAnnotation?.type === "shape"
                        ? selectedAnnotation.fillColor
                        : defaults.shapeFillColor) === "transparent"
                        ? "None"
                        : "Filled"}
                    </button>
                    {(selectedAnnotation?.type === "shape"
                      ? selectedAnnotation.fillColor
                      : defaults.shapeFillColor) !== "transparent" && (
                      <input
                        type="color"
                        value={
                          selectedAnnotation?.type === "shape"
                            ? selectedAnnotation.fillColor
                            : defaults.shapeFillColor
                        }
                        onChange={(e) => {
                          if (selectedAnnotation?.type === "shape") {
                            onUpdateSelected({ fillColor: e.target.value });
                          } else {
                            onUpdateDefaults({ shapeFillColor: e.target.value });
                          }
                        }}
                        className="w-6 h-6 rounded cursor-pointer border border-slate-200 bg-transparent"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1.5 pl-1 border-l border-[#E8E8E5]">
                  <span className="text-[11px] text-[#70757A]">Border:</span>
                  <select
                    value={
                      selectedAnnotation?.type === "shape"
                        ? selectedAnnotation.strokeWidth
                        : defaults.shapeStrokeWidth
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (selectedAnnotation?.type === "shape") {
                        onUpdateSelected({ strokeWidth: val });
                      } else {
                        onUpdateDefaults({ shapeStrokeWidth: val });
                      }
                    }}
                    className="px-1.5 py-0.5 rounded border border-[#E8E8E5] bg-[#FAFAF8] text-[11px] font-mono"
                  >
                    {[0, 1, 2, 3, 4, 6, 8, 12].map((w) => (
                      <option key={w} value={w}>
                        {w}pt
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Opacity slider for selected shape */}
            {selectedAnnotation?.type === "shape" && (
              <div className="flex items-center gap-1 pl-1 border-l border-[#E8E8E5]">
                <span className="text-[11px] text-[#70757A]">Opacity:</span>
                <input
                  type="range"
                  min={15}
                  max={100}
                  value={Math.round((selectedAnnotation.opacity ?? 1) * 100)}
                  onChange={(e) => onUpdateSelected({ opacity: Number(e.target.value) / 100 })}
                  className="w-16 accent-emerald-600"
                />
              </div>
            )}
          </>
        )}

        {/* IMAGE / STAMP OPACITY */}
        {showImageOrStampControls && selectedAnnotation && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {selectedAnnotation.type === "stamp"
                ? `Stamp: ${selectedAnnotation.text}`
                : selectedAnnotation.subtype === "signature"
                ? "Signature Selected"
                : "Image Selected"}
            </span>
            <div className="flex items-center gap-1 pl-2 border-l border-[#E8E8E5]">
              <span className="text-[11px] text-[#70757A]">Opacity:</span>
              <input
                type="range"
                min={20}
                max={100}
                value={Math.round((selectedAnnotation.opacity ?? 1) * 100)}
                onChange={(e) => onUpdateSelected({ opacity: Number(e.target.value) / 100 })}
                className="w-20 accent-emerald-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* Selected Element Quick Actions */}
      {selectedAnnotation && (
        <div className="flex items-center gap-1 pl-2 border-l border-[#E8E8E5] ml-auto">
          <button
            type="button"
            onClick={() => onLayerOrder("front")}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            title="Bring to Front"
          >
            <ArrowUpToLine className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onLayerOrder("back")}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            title="Send to Back"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDuplicateSelected}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDeleteSelected}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
