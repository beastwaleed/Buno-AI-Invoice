"use client";

import React, { useState, useRef } from "react";
import {
  PdfAnnotation,
  PdfAnnotationDraw,
  PdfAnnotationShape,
  PdfAnnotationText,
} from "@/lib/pdf/editPdf";
import { EditorToolMode, ToolDefaults } from "./EditorPropertiesBar";

interface InteractiveAnnotationLayerProps {
  pageId: string;
  pageWidthPx: number;
  pageHeightPx: number;
  renderScale: number;
  activeTool: EditorToolMode;
  defaults: ToolDefaults;
  annotations: PdfAnnotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddAnnotation: (annot: PdfAnnotation) => void;
  onLiveUpdateAnnotations: (next: PdfAnnotation[]) => void;
  onCommitAnnotations: (next: PdfAnnotation[]) => void;
}

type DragMode =
  | { kind: "none" }
  | {
      kind: "move";
      id: string;
      startMouseX: number;
      startMouseY: number;
      snapshot: PdfAnnotation;
      hasMoved: boolean;
    }
  | {
      kind: "resize";
      id: string;
      handle: "nw" | "ne" | "sw" | "se" | "e" | "w";
      startMouseX: number;
      startMouseY: number;
      origBox: { x: number; y: number; width: number; height: number };
      snapshot: PdfAnnotation;
      hasMoved: boolean;
    }
  | {
      kind: "draw-stroke";
      points: { x: number; y: number }[];
    }
  | {
      kind: "draw-shape";
      startX: number;
      startY: number;
      currX: number;
      currY: number;
    };

function getDrawBounds(annot: PdfAnnotationDraw): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  let minX = 1,
    minY = 1,
    maxX = 0,
    maxY = 0;
  for (const p of annot.points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    x: minX,
    y: minY,
    width: Math.max(0.02, maxX - minX),
    height: Math.max(0.02, maxY - minY),
  };
}

function getAnnotFontFamilyCss(family: "helvetica" | "times" | "courier"): string {
  if (family === "times") return "Georgia, 'Times New Roman', serif";
  if (family === "courier") return "'Courier New', Courier, monospace";
  return "Helvetica, Arial, sans-serif";
}

export const InteractiveAnnotationLayer: React.FC<InteractiveAnnotationLayerProps> = ({
  pageId,
  pageWidthPx,
  pageHeightPx,
  renderScale,
  activeTool,
  defaults,
  annotations,
  selectedId,
  onSelect,
  onAddAnnotation,
  onLiveUpdateAnnotations,
  onCommitAnnotations,
}) => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState<DragMode>({ kind: "none" });

  // Inline text draft (creating new or editing existing)
  const [textDraft, setTextDraft] = useState<{
    editingId: string | null;
    x: number;
    y: number;
    width: number;
    text: string;
    fontSize: number;
    fontFamily: "helvetica" | "times" | "courier";
    bold: boolean;
    italic: boolean;
    color: string;
    backgroundColor: string;
    align: "left" | "center" | "right";
  } | null>(null);

  const pageAnnots = annotations.filter((a) => a.pageId === pageId);

  const getRelCoords = (clientX: number, clientY: number) => {
    const el = layerRef.current;
    if (!el) return { rx: 0, ry: 0 };
    const rect = el.getBoundingClientRect();
    const rx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ry = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { rx, ry };
  };

  const commitTextDraft = () => {
    if (!textDraft) return;
    const trimmed = textDraft.text.trimEnd();
    if (!trimmed.trim()) {
      // If editing an existing box and cleared text, leave unchanged or delete? Cancel edit safely.
      setTextDraft(null);
      return;
    }

    if (textDraft.editingId) {
      const updated = annotations.map((a) =>
        a.id === textDraft.editingId && a.type === "text"
          ? { ...a, text: trimmed }
          : a
      );
      onCommitAnnotations(updated);
      onSelect(textDraft.editingId);
    } else {
      const newId = `text-${Date.now()}`;
      const newText: PdfAnnotationText = {
        id: newId,
        type: "text",
        pageId,
        x: Math.min(0.92, textDraft.x),
        y: Math.min(0.94, textDraft.y),
        width: textDraft.width,
        text: trimmed,
        fontSize: textDraft.fontSize,
        fontFamily: textDraft.fontFamily,
        bold: textDraft.bold,
        italic: textDraft.italic,
        color: textDraft.color,
        backgroundColor: textDraft.backgroundColor,
        opacity: 1,
        align: textDraft.align,
      };
      onAddAnnotation(newText);
      onSelect(newId);
    }
    setTextDraft(null);
  };

  const handleBackgroundPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (textDraft) {
      commitTextDraft();
      return;
    }

    const { rx, ry } = getRelCoords(e.clientX, e.clientY);

    if (activeTool === "select") {
      onSelect(null);
      return;
    }

    if (activeTool === "text") {
      setTextDraft({
        editingId: null,
        x: Math.min(0.75, rx),
        y: Math.min(0.9, ry),
        width: 0.25,
        text: "",
        fontSize: defaults.fontSize,
        fontFamily: defaults.fontFamily,
        bold: defaults.bold,
        italic: defaults.italic,
        color: defaults.textColor,
        backgroundColor: defaults.textBgColor,
        align: defaults.align,
      });
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    if (activeTool === "draw") {
      setDrag({ kind: "draw-stroke", points: [{ x: rx, y: ry }] });
    } else if (
      activeTool === "highlight" ||
      activeTool === "whiteout" ||
      activeTool === "shape"
    ) {
      setDrag({ kind: "draw-shape", startX: rx, startY: ry, currX: rx, currY: ry });
    }
  };

  const handleAnnotationPointerDown = (
    e: React.PointerEvent,
    annot: PdfAnnotation
  ) => {
    // Allow clicking through to draw if user is in freehand/shape/highlight/whiteout mode
    if (activeTool !== "select" && !(activeTool === "text" && annot.type === "text")) {
      return;
    }

    e.stopPropagation();
    if (textDraft) commitTextDraft();

    onSelect(annot.id);
    e.currentTarget.setPointerCapture(e.pointerId);

    setDrag({
      kind: "move",
      id: annot.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      snapshot: JSON.parse(JSON.stringify(annot)),
      hasMoved: false,
    });
  };

  const handleResizePointerDown = (
    e: React.PointerEvent,
    annot: PdfAnnotation,
    handle: "nw" | "ne" | "sw" | "se" | "e" | "w"
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    let origBox = { x: 0, y: 0, width: 0.1, height: 0.1 };
    if (annot.type === "draw") {
      origBox = getDrawBounds(annot);
    } else if (annot.type === "text") {
      const approxLines = Math.max(1, annot.text.split("\n").length);
      const estH = Math.max(
        0.04,
        (approxLines * annot.fontSize * 1.35 * renderScale) / Math.max(1, pageHeightPx)
      );
      origBox = { x: annot.x, y: annot.y, width: annot.width || 0.25, height: estH };
    } else {
      origBox = { x: annot.x, y: annot.y, width: annot.width, height: annot.height };
    }

    setDrag({
      kind: "resize",
      id: annot.id,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      origBox,
      snapshot: JSON.parse(JSON.stringify(annot)),
      hasMoved: false,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.kind === "none") return;

    if (drag.kind === "draw-stroke") {
      const { rx, ry } = getRelCoords(e.clientX, e.clientY);
      const last = drag.points[drag.points.length - 1];
      if (!last || Math.hypot(rx - last.x, ry - last.y) > 0.002) {
        setDrag({ kind: "draw-stroke", points: [...drag.points, { x: rx, y: ry }] });
      }
      return;
    }

    if (drag.kind === "draw-shape") {
      const { rx, ry } = getRelCoords(e.clientX, e.clientY);
      setDrag({ ...drag, currX: rx, currY: ry });
      return;
    }

    const dx = (e.clientX - drag.startMouseX) / Math.max(1, pageWidthPx);
    const dy = (e.clientY - drag.startMouseY) / Math.max(1, pageHeightPx);

    if (drag.kind === "move") {
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return;
      const snap = drag.snapshot;
      const nextList = annotations.map((a) => {
        if (a.id !== drag.id) return a;
        if (snap.type === "draw") {
          return {
            ...snap,
            points: snap.points.map((pt) => ({
              x: Math.max(0, Math.min(1, pt.x + dx)),
              y: Math.max(0, Math.min(1, pt.y + dy)),
            })),
          };
        }
        return {
          ...snap,
          x: Math.max(0, Math.min(0.98, snap.x + dx)),
          y: Math.max(0, Math.min(0.98, snap.y + dy)),
        };
      });
      setDrag({ ...drag, hasMoved: true });
      onLiveUpdateAnnotations(nextList);
      return;
    }

    if (drag.kind === "resize") {
      const { origBox, handle, snapshot } = drag;
      let newX = origBox.x;
      let newY = origBox.y;
      let newW = origBox.width;
      let newH = origBox.height;

      if (handle.includes("e")) newW = Math.max(0.03, origBox.width + dx);
      if (handle.includes("w")) {
        const clampedDx = Math.min(dx, origBox.width - 0.03);
        newX = Math.max(0, origBox.x + clampedDx);
        newW = origBox.width - (newX - origBox.x);
      }
      if (handle.includes("s")) newH = Math.max(0.018, origBox.height + dy);
      if (handle.includes("n")) {
        const clampedDy = Math.min(dy, origBox.height - 0.018);
        newY = Math.max(0, origBox.y + clampedDy);
        newH = origBox.height - (newY - origBox.y);
      }

      const nextList = annotations.map((a) => {
        if (a.id !== drag.id) return a;
        if (snapshot.type === "text") {
          // Corner vertical drag scales font size gently; edge E/W changes wrapping width
          const scaleFactor =
            handle === "e" || handle === "w" ? 1 : Math.max(0.5, newH / Math.max(0.02, origBox.height));
          return {
            ...snapshot,
            x: newX,
            y: newY,
            width: Math.max(0.08, newW),
            fontSize: Math.round(Math.max(8, Math.min(72, snapshot.fontSize * scaleFactor))),
          };
        }
        if (snapshot.type === "draw") {
          const sx = newW / Math.max(0.01, origBox.width);
          const sy = newH / Math.max(0.01, origBox.height);
          return {
            ...snapshot,
            points: snapshot.points.map((pt) => ({
              x: newX + (pt.x - origBox.x) * sx,
              y: newY + (pt.y - origBox.y) * sy,
            })),
          };
        }
        return {
          ...snapshot,
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        };
      });

      setDrag({ ...drag, hasMoved: true });
      onLiveUpdateAnnotations(nextList);
    }
  };

  const handlePointerUp = () => {
    if (drag.kind === "none") return;

    if (drag.kind === "draw-stroke") {
      if (drag.points.length > 1) {
        const newId = `draw-${Date.now()}`;
        const drawAnnot: PdfAnnotationDraw = {
          id: newId,
          type: "draw",
          pageId,
          points: drag.points,
          color: defaults.drawColor,
          strokeWidth: defaults.drawStrokeWidth,
          opacity: defaults.drawOpacity,
        };
        onAddAnnotation(drawAnnot);
      }
      setDrag({ kind: "none" });
      return;
    }

    if (drag.kind === "draw-shape") {
      const rawW = Math.abs(drag.currX - drag.startX);
      const rawH = Math.abs(drag.currY - drag.startY);
      const isTinyTap = rawW < 0.015 && rawH < 0.015;

      const shapeKind =
        activeTool === "highlight"
          ? "highlight"
          : activeTool === "whiteout"
          ? "whiteout"
          : defaults.shapeKind;

      const x = isTinyTap
        ? Math.max(0, drag.startX - 0.12)
        : Math.min(drag.startX, drag.currX);
      const y = isTinyTap
        ? Math.max(0, drag.startY - (shapeKind === "highlight" || shapeKind === "whiteout" ? 0.018 : 0.05))
        : Math.min(drag.startY, drag.currY);
      const width = isTinyTap ? 0.24 : Math.max(0.02, rawW);
      const height = isTinyTap
        ? shapeKind === "highlight" || shapeKind === "whiteout"
          ? 0.036
          : 0.1
        : Math.max(0.015, rawH);

      const newId = `shape-${Date.now()}`;
      let shapeAnnot: PdfAnnotationShape;

      if (shapeKind === "highlight") {
        shapeAnnot = {
          id: newId,
          type: "shape",
          shapeType: "highlight",
          pageId,
          x,
          y,
          width,
          height,
          strokeColor: "transparent",
          fillColor: defaults.shapeFillColor === "transparent" ? "#facc15" : defaults.shapeFillColor,
          strokeWidth: 0,
          opacity: 0.42,
        };
      } else if (shapeKind === "whiteout") {
        shapeAnnot = {
          id: newId,
          type: "shape",
          shapeType: "whiteout",
          pageId,
          x,
          y,
          width,
          height,
          strokeColor: "transparent",
          fillColor: "#ffffff",
          strokeWidth: 0,
          opacity: 1,
        };
      } else {
        shapeAnnot = {
          id: newId,
          type: "shape",
          shapeType: shapeKind,
          pageId,
          x,
          y,
          width,
          height,
          flipX: drag.currX < drag.startX,
          flipY: drag.currY < drag.startY,
          strokeColor: defaults.shapeStrokeColor,
          fillColor:
            shapeKind === "line" || shapeKind === "arrow"
              ? "transparent"
              : shapeKind === "redact"
              ? "#0f172a"
              : defaults.shapeFillColor,
          strokeWidth: shapeKind === "redact" ? 0 : defaults.shapeStrokeWidth,
          opacity: defaults.shapeOpacity,
        };
      }

      onAddAnnotation(shapeAnnot);
      onSelect(newId);
      setDrag({ kind: "none" });
      return;
    }

    if ((drag.kind === "move" || drag.kind === "resize") && drag.hasMoved) {
      onCommitAnnotations(annotations);
    }

    setDrag({ kind: "none" });
  };

  // Compute live drag-shape preview coordinates
  const liveShapeBox =
    drag.kind === "draw-shape"
      ? {
          x: Math.min(drag.startX, drag.currX),
          y: Math.min(drag.startY, drag.currY),
          w: Math.max(0.005, Math.abs(drag.currX - drag.startX)),
          h: Math.max(0.005, Math.abs(drag.currY - drag.startY)),
          flipX: drag.currX < drag.startX,
          flipY: drag.currY < drag.startY,
        }
      : null;

  return (
    <div
      ref={layerRef}
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`absolute inset-0 touch-none select-none overflow-hidden ${
        activeTool === "select"
          ? "cursor-default"
          : activeTool === "text"
          ? "cursor-text"
          : "cursor-crosshair"
      }`}
    >
      {/* Vector SVG Layer for Shapes & Freehand Drawings */}
      <svg
        viewBox={`0 0 ${Math.max(1, pageWidthPx)} ${Math.max(1, pageHeightPx)}`}
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          {pageAnnots
            .filter((a): a is PdfAnnotationShape => a.type === "shape" && a.shapeType === "arrow")
            .map((arr) => (
              <marker
                key={`marker-${arr.id}`}
                id={`arrowhead-${arr.id}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L7,3 z" fill={arr.strokeColor} />
              </marker>
            ))}
        </defs>

        {pageAnnots.map((annot) => {
          if (annot.type === "draw" && annot.points.length > 1) {
            const pts = annot.points
              .map((p) => `${p.x * pageWidthPx},${p.y * pageHeightPx}`)
              .join(" ");
            return (
              <polyline
                key={annot.id}
                points={pts}
                fill="none"
                stroke={annot.color}
                strokeWidth={Math.max(1, annot.strokeWidth * renderScale)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={annot.opacity ?? 1}
              />
            );
          }

          if (annot.type === "shape") {
            const sx = annot.x * pageWidthPx;
            const sy = annot.y * pageHeightPx;
            const sw = annot.width * pageWidthPx;
            const sh = annot.height * pageHeightPx;
            const strokeW = annot.strokeWidth * renderScale;
            const fill = annot.fillColor === "transparent" ? "none" : annot.fillColor;

            if (annot.shapeType === "circle") {
              return (
                <ellipse
                  key={annot.id}
                  cx={sx + sw / 2}
                  cy={sy + sh / 2}
                  rx={sw / 2}
                  ry={sh / 2}
                  fill={fill}
                  stroke={strokeW > 0 ? annot.strokeColor : "none"}
                  strokeWidth={strokeW}
                  opacity={annot.opacity}
                />
              );
            }

            if (annot.shapeType === "line" || annot.shapeType === "arrow") {
              const x1 = annot.flipX ? sx + sw : sx;
              const y1 = annot.flipY ? sy + sh : sy;
              const x2 = annot.flipX ? sx : sx + sw;
              const y2 = annot.flipY ? sy : sy + sh;
              return (
                <line
                  key={annot.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={annot.strokeColor}
                  strokeWidth={Math.max(1.5, strokeW)}
                  strokeLinecap="round"
                  opacity={annot.opacity}
                  markerEnd={
                    annot.shapeType === "arrow" ? `url(#arrowhead-${annot.id})` : undefined
                  }
                />
              );
            }

            return (
              <rect
                key={annot.id}
                x={sx}
                y={sy}
                width={sw}
                height={sh}
                fill={fill}
                stroke={strokeW > 0 ? annot.strokeColor : "none"}
                strokeWidth={strokeW}
                opacity={annot.opacity}
              />
            );
          }

          return null;
        })}

        {/* Active Freehand Preview */}
        {drag.kind === "draw-stroke" && drag.points.length > 1 && (
          <polyline
            points={drag.points
              .map((p) => `${p.x * pageWidthPx},${p.y * pageHeightPx}`)
              .join(" ")}
            fill="none"
            stroke={defaults.drawColor}
            strokeWidth={Math.max(1, defaults.drawStrokeWidth * renderScale)}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={defaults.drawOpacity}
          />
        )}

        {/* Active Shape Drag Preview */}
        {liveShapeBox && (
          <>
            {activeTool === "highlight" ? (
              <rect
                x={liveShapeBox.x * pageWidthPx}
                y={liveShapeBox.y * pageHeightPx}
                width={liveShapeBox.w * pageWidthPx}
                height={liveShapeBox.h * pageHeightPx}
                fill={defaults.shapeFillColor === "transparent" ? "#facc15" : defaults.shapeFillColor}
                opacity={0.42}
              />
            ) : activeTool === "whiteout" ? (
              <rect
                x={liveShapeBox.x * pageWidthPx}
                y={liveShapeBox.y * pageHeightPx}
                width={liveShapeBox.w * pageWidthPx}
                height={liveShapeBox.h * pageHeightPx}
                fill="#ffffff"
                stroke="#94a3b8"
                strokeDasharray="4 2"
                strokeWidth={1}
              />
            ) : defaults.shapeKind === "circle" ? (
              <ellipse
                cx={(liveShapeBox.x + liveShapeBox.w / 2) * pageWidthPx}
                cy={(liveShapeBox.y + liveShapeBox.h / 2) * pageHeightPx}
                rx={(liveShapeBox.w * pageWidthPx) / 2}
                ry={(liveShapeBox.h * pageHeightPx) / 2}
                fill={defaults.shapeFillColor === "transparent" ? "none" : defaults.shapeFillColor}
                stroke={defaults.shapeStrokeColor}
                strokeWidth={Math.max(1, defaults.shapeStrokeWidth * renderScale)}
              />
            ) : defaults.shapeKind === "line" || defaults.shapeKind === "arrow" ? (
              <line
                x1={(liveShapeBox.flipX ? liveShapeBox.x + liveShapeBox.w : liveShapeBox.x) * pageWidthPx}
                y1={(liveShapeBox.flipY ? liveShapeBox.y + liveShapeBox.h : liveShapeBox.y) * pageHeightPx}
                x2={(liveShapeBox.flipX ? liveShapeBox.x : liveShapeBox.x + liveShapeBox.w) * pageWidthPx}
                y2={(liveShapeBox.flipY ? liveShapeBox.y : liveShapeBox.y + liveShapeBox.h) * pageHeightPx}
                stroke={defaults.shapeStrokeColor}
                strokeWidth={Math.max(1.5, defaults.shapeStrokeWidth * renderScale)}
                strokeDasharray="4 2"
              />
            ) : (
              <rect
                x={liveShapeBox.x * pageWidthPx}
                y={liveShapeBox.y * pageHeightPx}
                width={liveShapeBox.w * pageWidthPx}
                height={liveShapeBox.h * pageHeightPx}
                fill={
                  defaults.shapeKind === "redact"
                    ? "#0f172a"
                    : defaults.shapeFillColor === "transparent"
                    ? "none"
                    : defaults.shapeFillColor
                }
                stroke={defaults.shapeStrokeColor}
                strokeWidth={Math.max(1, defaults.shapeStrokeWidth * renderScale)}
              />
            )}
          </>
        )}
      </svg>

      {/* Interactive HTML Elements (Text, Images, Stamps, and Hit Targets/Selection Boxes) */}
      {pageAnnots.map((annot) => {
        const isSelected = selectedId === annot.id;

        if (annot.type === "text") {
          const isEditingThis = textDraft?.editingId === annot.id;
          if (isEditingThis) return null;

          const approxLines = Math.max(1, annot.text.split("\n").length);
          return (
            <div
              key={annot.id}
              onPointerDown={(e) => handleAnnotationPointerDown(e, annot)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setTextDraft({
                  editingId: annot.id,
                  x: annot.x,
                  y: annot.y,
                  width: annot.width || 0.25,
                  text: annot.text,
                  fontSize: annot.fontSize,
                  fontFamily: annot.fontFamily || "helvetica",
                  bold: Boolean(annot.bold),
                  italic: Boolean(annot.italic),
                  color: annot.color,
                  backgroundColor: annot.backgroundColor || "transparent",
                  align: annot.align || "left",
                });
              }}
              style={{
                left: `${annot.x * 100}%`,
                top: `${annot.y * 100}%`,
                width: `${(annot.width || 0.25) * 100}%`,
                minHeight: `${Math.max(20, approxLines * annot.fontSize * 1.25 * renderScale)}px`,
                fontFamily: getAnnotFontFamilyCss(annot.fontFamily || "helvetica"),
                fontSize: `${annot.fontSize * renderScale}px`,
                lineHeight: 1.25,
                fontWeight: annot.bold ? 700 : 400,
                fontStyle: annot.italic ? "italic" : "normal",
                color: annot.color,
                backgroundColor:
                  annot.backgroundColor && annot.backgroundColor !== "transparent"
                    ? annot.backgroundColor
                    : "transparent",
                textAlign: annot.align || "left",
                opacity: annot.opacity ?? 1,
                pointerEvents: activeTool === "select" || activeTool === "text" ? "auto" : "none",
              }}
              className={`absolute px-1 py-0.5 whitespace-pre-wrap break-words cursor-move transition-shadow ${
                isSelected
                  ? "ring-2 ring-emerald-500 bg-emerald-500/5"
                  : "hover:ring-1 hover:ring-emerald-400/60"
              }`}
            >
              {annot.text}

              {isSelected && (
                <>
                  {(["nw", "ne", "sw", "se", "e", "w"] as const).map((h) => (
                    <div
                      key={h}
                      onPointerDown={(e) => handleResizePointerDown(e, annot, h)}
                      className={`absolute w-2.5 h-2.5 bg-white border-2 border-emerald-600 rounded-full z-20 ${
                        h === "nw"
                          ? "-top-1.5 -left-1.5 cursor-nwse-resize"
                          : h === "ne"
                          ? "-top-1.5 -right-1.5 cursor-nesw-resize"
                          : h === "sw"
                          ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                          : h === "se"
                          ? "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                          : h === "e"
                          ? "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize"
                          : "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        }

        if (annot.type === "image") {
          return (
            <div
              key={annot.id}
              onPointerDown={(e) => handleAnnotationPointerDown(e, annot)}
              style={{
                left: `${annot.x * 100}%`,
                top: `${annot.y * 100}%`,
                width: `${annot.width * 100}%`,
                height: `${annot.height * 100}%`,
                opacity: annot.opacity ?? 1,
                pointerEvents: activeTool === "select" ? "auto" : "none",
              }}
              className={`absolute cursor-move ${
                isSelected ? "ring-2 ring-emerald-500" : "hover:ring-1 hover:ring-emerald-400/60"
              }`}
            >
              <img
                src={annot.dataUrl}
                alt={annot.label || "Inserted graphic"}
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
              />
              {isSelected && (
                <>
                  {(["nw", "ne", "sw", "se"] as const).map((h) => (
                    <div
                      key={h}
                      onPointerDown={(e) => handleResizePointerDown(e, annot, h)}
                      className={`absolute w-2.5 h-2.5 bg-white border-2 border-emerald-600 rounded-full z-20 ${
                        h === "nw"
                          ? "-top-1.5 -left-1.5 cursor-nwse-resize"
                          : h === "ne"
                          ? "-top-1.5 -right-1.5 cursor-nesw-resize"
                          : h === "sw"
                          ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                          : "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        }

        if (annot.type === "stamp") {
          return (
            <div
              key={annot.id}
              onPointerDown={(e) => handleAnnotationPointerDown(e, annot)}
              style={{
                left: `${annot.x * 100}%`,
                top: `${annot.y * 100}%`,
                width: `${annot.width * 100}%`,
                height: `${annot.height * 100}%`,
                opacity: annot.opacity ?? 0.9,
                borderColor: annot.variant === "badge" ? annot.color : "transparent",
                color: annot.color,
                backgroundColor: annot.variant === "badge" ? `${annot.color}14` : "transparent",
                pointerEvents: activeTool === "select" ? "auto" : "none",
              }}
              className={`absolute flex items-center justify-center font-black tracking-wider uppercase cursor-move ${
                annot.variant === "badge" ? "border-[2.5px] rounded-md" : ""
              } ${isSelected ? "ring-2 ring-emerald-500" : "hover:ring-1 hover:ring-emerald-400/60"}`}
            >
              <span
                style={{
                  fontSize: `${Math.max(
                    10,
                    Math.min(
                      annot.height * pageHeightPx * 0.56,
                      (annot.width * pageWidthPx) / Math.max(annot.text.length, 2) * 1.3
                    )
                  )}px`,
                }}
              >
                {annot.text}
              </span>
              {isSelected && (
                <>
                  {(["nw", "ne", "sw", "se"] as const).map((h) => (
                    <div
                      key={h}
                      onPointerDown={(e) => handleResizePointerDown(e, annot, h)}
                      className={`absolute w-2.5 h-2.5 bg-white border-2 border-emerald-600 rounded-full z-20 ${
                        h === "nw"
                          ? "-top-1.5 -left-1.5 cursor-nwse-resize"
                          : h === "ne"
                          ? "-top-1.5 -right-1.5 cursor-nesw-resize"
                          : h === "sw"
                          ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                          : "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
          );
        }

        // Hit box + selection handles for SVG shapes and freehand strokes
        const box =
          annot.type === "draw"
            ? getDrawBounds(annot)
            : { x: annot.x, y: annot.y, width: annot.width, height: annot.height };

        return (
          <div
            key={`hit-${annot.id}`}
            onPointerDown={(e) => handleAnnotationPointerDown(e, annot)}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${Math.max(0.02, box.width) * 100}%`,
              height: `${Math.max(0.02, box.height) * 100}%`,
              pointerEvents: activeTool === "select" ? "auto" : "none",
            }}
            className={`absolute cursor-move ${
              isSelected
                ? "ring-2 ring-emerald-500 bg-emerald-500/5"
                : "hover:ring-1 hover:ring-emerald-400/50"
            }`}
          >
            {isSelected && (
              <>
                {(["nw", "ne", "sw", "se"] as const).map((h) => (
                  <div
                    key={h}
                    onPointerDown={(e) => handleResizePointerDown(e, annot, h)}
                    className={`absolute w-2.5 h-2.5 bg-white border-2 border-emerald-600 rounded-full z-20 ${
                      h === "nw"
                        ? "-top-1.5 -left-1.5 cursor-nwse-resize"
                        : h === "ne"
                        ? "-top-1.5 -right-1.5 cursor-nesw-resize"
                        : h === "sw"
                        ? "-bottom-1.5 -left-1.5 cursor-nesw-resize"
                        : "-bottom-1.5 -right-1.5 cursor-nwse-resize"
                    }`}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}

      {/* Inline Floating Text Editor */}
      {textDraft && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            left: `${textDraft.x * 100}%`,
            top: `${textDraft.y * 100}%`,
            width: `${Math.max(22, textDraft.width * 100)}%`,
          }}
          className="absolute z-30 min-w-[180px]"
        >
          <textarea
            autoFocus
            rows={2}
            value={textDraft.text}
            onChange={(e) => setTextDraft({ ...textDraft, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitTextDraft();
              } else if (e.key === "Escape") {
                setTextDraft(null);
              }
            }}
            placeholder="Type text... (Enter to apply)"
            style={{
              fontFamily: getAnnotFontFamilyCss(textDraft.fontFamily),
              fontSize: `${textDraft.fontSize * renderScale}px`,
              lineHeight: 1.25,
              fontWeight: textDraft.bold ? 700 : 400,
              fontStyle: textDraft.italic ? "italic" : "normal",
              color: textDraft.color,
              backgroundColor:
                textDraft.backgroundColor && textDraft.backgroundColor !== "transparent"
                  ? textDraft.backgroundColor
                  : "rgba(255,255,255,0.92)",
              textAlign: textDraft.align,
            }}
            className="w-full px-1.5 py-1 rounded border-2 border-emerald-500 shadow-lg focus:outline-none resize"
          />
          <div className="mt-1 flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setTextDraft(null)}
              className="px-2 py-0.5 text-[11px] bg-white border border-slate-200 text-slate-600 rounded shadow-2xs hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitTextDraft}
              className="px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-600 text-white rounded shadow-2xs hover:bg-emerald-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
