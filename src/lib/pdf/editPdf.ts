import { PDFDocument, rgb, degrees, StandardFonts, PDFFont } from "pdf-lib";

export interface PdfPageMeta {
  id: string;
  sourceType: "original" | "blank";
  originalIndex: number; // -1 if blank
  rotation: number; // user-added clockwise rotation: 0, 90, 180, 270
  width?: number; // PDF points for blank pages (default A4: 595.28)
  height?: number; // PDF points for blank pages (default A4: 841.89)
}

export interface PdfAnnotationText {
  id: string;
  type: "text";
  pageId: string;
  x: number; // 0 to 1 relative to visual page width
  y: number; // 0 to 1 relative to visual page height
  width: number; // 0 to 1
  height?: number;
  text: string;
  fontSize: number; // PDF points (e.g., 8 to 72)
  fontFamily: "helvetica" | "times" | "courier";
  bold?: boolean;
  italic?: boolean;
  color: string; // hex #000000
  backgroundColor?: string; // "transparent" or hex
  opacity?: number;
  align?: "left" | "center" | "right";
}

export type PdfShapeKind =
  | "rect"
  | "circle"
  | "highlight"
  | "whiteout"
  | "redact"
  | "line"
  | "arrow";

export interface PdfAnnotationShape {
  id: string;
  type: "shape";
  shapeType: PdfShapeKind;
  pageId: string;
  x: number; // 0 to 1 (top-left of bounding box)
  y: number; // 0 to 1
  width: number; // 0 to 1
  height: number; // 0 to 1
  flipX?: boolean; // for line/arrow direction
  flipY?: boolean; // for line/arrow direction
  strokeColor: string;
  fillColor: string; // "transparent" or hex
  strokeWidth: number; // PDF points
  opacity: number; // 0.05 to 1
}

export interface PdfAnnotationDraw {
  id: string;
  type: "draw";
  pageId: string;
  points: { x: number; y: number }[]; // relative 0 to 1
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export interface PdfAnnotationImage {
  id: string;
  type: "image";
  subtype: "signature" | "image";
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string; // PNG or JPEG data URL
  opacity?: number;
  label?: string;
}

export interface PdfAnnotationStamp {
  id: string;
  type: "stamp";
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  variant: "badge" | "symbol";
  opacity?: number;
}

export type PdfAnnotation =
  | PdfAnnotationText
  | PdfAnnotationShape
  | PdfAnnotationDraw
  | PdfAnnotationImage
  | PdfAnnotationStamp;

export interface PdfEditState {
  pages: PdfPageMeta[];
  annotations: PdfAnnotation[];
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || hex === "transparent") return { r: 0, g: 0, b: 0 };
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 };
  if (clean.length === 3) {
    const r = ((num >> 8) & 0xf) * 17;
    const g = ((num >> 4) & 0xf) * 17;
    const b = (num & 0xf) * 17;
    return { r: r / 255, g: g / 255, b: b / 255 };
  }
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function normalizeRotation(angle: number): 0 | 90 | 180 | 270 {
  const norm = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
  if (norm === 90 || norm === 180 || norm === 270) return norm;
  return 0;
}

/**
 * Converts normalized top-left visual coordinates (vx, vy in 0..1) to PDF MediaBox coordinates.
 */
function visualToMediaBox(
  vx: number,
  vy: number,
  mbW: number,
  mbH: number,
  rot: 0 | 90 | 180 | 270
): { x: number; y: number } {
  switch (rot) {
    case 90:
      return { x: vy * mbW, y: vx * mbH };
    case 180:
      return { x: (1 - vx) * mbW, y: vy * mbH };
    case 270:
      return { x: (1 - vy) * mbW, y: (1 - vx) * mbH };
    case 0:
    default:
      return { x: vx * mbW, y: (1 - vy) * mbH };
  }
}

function dataUrlToUint8Array(dataUrl: string): { bytes: Uint8Array; isPng: boolean; isJpg: boolean } {
  const [header, base64] = dataUrl.split(",");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const lower = header.toLowerCase();
  return {
    bytes,
    isPng: lower.includes("png"),
    isJpg: lower.includes("jpeg") || lower.includes("jpg"),
  };
}

/**
 * Converts any image dataUrl (e.g. WebP/SVG) to a PNG Uint8Array using an offscreen canvas.
 */
async function convertDataUrlToPngBytes(dataUrl: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 200;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      resolve(dataUrlToUint8Array(pngUrl).bytes);
    };
    img.onerror = () => reject(new Error("Failed to load image for PDF embedding"));
    img.src = dataUrl;
  });
}

/**
 * Renders Unicode/complex text to a crisp transparent PNG when StandardFonts cannot encode characters.
 */
async function renderTextBlockToPng(
  annot: PdfAnnotationText,
  targetWidthPt: number
): Promise<{ bytes: Uint8Array; widthPt: number; heightPt: number }> {
  const scale = 3;
  const paddingX = 4;
  const paddingY = 4;
  const fontFamilyCss =
    annot.fontFamily === "times"
      ? "Georgia, 'Times New Roman', serif"
      : annot.fontFamily === "courier"
      ? "'Courier New', Courier, monospace"
      : "Helvetica, Arial, sans-serif";
  const fontSpec = `${annot.italic ? "italic " : ""}${annot.bold ? "bold " : ""}${annot.fontSize * scale}px ${fontFamilyCss}`;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = fontSpec;

  const lineHeight = annot.fontSize * 1.25;
  const rawLines = annot.text.split(/\r?\n/);
  const wrappedLines: string[] = [];
  const maxInnerW = Math.max(40, targetWidthPt - paddingX * 2) * scale;

  for (const rawLine of rawLines) {
    if (!rawLine) {
      wrappedLines.push("");
      continue;
    }
    const words = rawLine.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxInnerW || !current) {
        current = candidate;
      } else {
        wrappedLines.push(current);
        current = word;
      }
    }
    if (current) wrappedLines.push(current);
  }

  const widthPt = Math.max(targetWidthPt, 24);
  const heightPt = Math.max(lineHeight + paddingY * 2, wrappedLines.length * lineHeight + paddingY * 2);

  canvas.width = Math.ceil(widthPt * scale);
  canvas.height = Math.ceil(heightPt * scale);

  if (annot.backgroundColor && annot.backgroundColor !== "transparent") {
    ctx.fillStyle = annot.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.font = fontSpec;
  ctx.fillStyle = annot.color;
  ctx.globalAlpha = annot.opacity ?? 1;
  ctx.textBaseline = "top";

  wrappedLines.forEach((line, idx) => {
    let drawX = paddingX * scale;
    if (annot.align === "center") {
      const lw = ctx.measureText(line).width;
      drawX = (canvas.width - lw) / 2;
    } else if (annot.align === "right") {
      const lw = ctx.measureText(line).width;
      drawX = canvas.width - paddingX * scale - lw;
    }
    ctx.fillText(line, drawX, (paddingY + idx * lineHeight) * scale);
  });

  const pngUrl = canvas.toDataURL("image/png");
  return {
    bytes: dataUrlToUint8Array(pngUrl).bytes,
    widthPt,
    heightPt,
  };
}

/**
 * Renders a stamp badge or symbol cleanly at high DPI to PNG so Unicode/borders always render cleanly.
 */
async function renderStampToPng(
  stamp: PdfAnnotationStamp,
  widthPt: number,
  heightPt: number
): Promise<Uint8Array> {
  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(60, Math.ceil(widthPt * scale));
  canvas.height = Math.max(30, Math.ceil(heightPt * scale));
  const ctx = canvas.getContext("2d")!;

  ctx.globalAlpha = stamp.opacity ?? 0.9;
  const c = stamp.color || "#dc2626";

  if (stamp.variant === "symbol") {
    ctx.strokeStyle = c;
    ctx.lineWidth = Math.max(4, Math.min(canvas.width, canvas.height) * 0.14);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (stamp.text === "✓") {
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.18, canvas.height * 0.54);
      ctx.lineTo(canvas.width * 0.42, canvas.height * 0.78);
      ctx.lineTo(canvas.width * 0.82, canvas.height * 0.24);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.22, canvas.height * 0.22);
      ctx.lineTo(canvas.width * 0.78, canvas.height * 0.78);
      ctx.moveTo(canvas.width * 0.78, canvas.height * 0.22);
      ctx.lineTo(canvas.width * 0.22, canvas.height * 0.78);
      ctx.stroke();
    }
  } else {
    const pad = 4 * scale;
    const bw = canvas.width - pad * 2;
    const bh = canvas.height - pad * 2;
    const radius = 8 * scale;

    ctx.strokeStyle = c;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.roundRect(pad, pad, bw, bh, radius);
    ctx.stroke();

    ctx.fillStyle = `${c}14`;
    ctx.fill();

    const fontPx = Math.min(bh * 0.48, (bw / Math.max(stamp.text.length, 4)) * 1.35);
    ctx.font = `900 ${fontPx}px Helvetica, Arial, sans-serif`;
    ctx.fillStyle = c;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(stamp.text.toUpperCase(), canvas.width / 2, canvas.height / 2 + scale);
  }

  return dataUrlToUint8Array(canvas.toDataURL("image/png")).bytes;
}

function wrapTextForPdfFont(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/**
 * Applies page reordering, blank pages, rotations, and all annotations into a new PDF document.
 */
export async function applyPdfEdits(
  originalPdfBytes: ArrayBuffer,
  editState: PdfEditState
): Promise<{ blob: Blob; uint8Array: Uint8Array }> {
  const srcDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  // Embed font matrix lazily
  const fontCache: Partial<Record<string, PDFFont>> = {};
  const getFont = async (
    family: "helvetica" | "times" | "courier",
    bold?: boolean,
    italic?: boolean
  ): Promise<PDFFont> => {
    const key = `${family}-${bold ? "b" : ""}-${italic ? "i" : ""}`;
    if (fontCache[key]) return fontCache[key]!;
    let std = StandardFonts.Helvetica;
    if (family === "helvetica") {
      std =
        bold && italic
          ? StandardFonts.HelveticaBoldOblique
          : bold
          ? StandardFonts.HelveticaBold
          : italic
          ? StandardFonts.HelveticaOblique
          : StandardFonts.Helvetica;
    } else if (family === "times") {
      std =
        bold && italic
          ? StandardFonts.TimesRomanBoldItalic
          : bold
          ? StandardFonts.TimesRomanBold
          : italic
          ? StandardFonts.TimesRomanItalic
          : StandardFonts.TimesRoman;
    } else if (family === "courier") {
      std =
        bold && italic
          ? StandardFonts.CourierBoldOblique
          : bold
          ? StandardFonts.CourierBold
          : italic
          ? StandardFonts.CourierOblique
          : StandardFonts.Courier;
    }
    fontCache[key] = await outDoc.embedFont(std);
    return fontCache[key]!;
  };

  // Assemble pages in user-defined order
  const pageCountSrc = srcDoc.getPageCount();
  for (const pageMeta of editState.pages) {
    let page;
    if (pageMeta.sourceType === "blank") {
      page = outDoc.addPage([pageMeta.width || 595.28, pageMeta.height || 841.89]);
      if (pageMeta.rotation) {
        page.setRotation(degrees(normalizeRotation(pageMeta.rotation)));
      }
    } else {
      if (pageMeta.originalIndex < 0 || pageMeta.originalIndex >= pageCountSrc) continue;
      const [copiedPage] = await outDoc.copyPages(srcDoc, [pageMeta.originalIndex]);
      outDoc.addPage(copiedPage);
      page = copiedPage;
      const currentRot = page.getRotation().angle;
      if (pageMeta.rotation) {
        page.setRotation(degrees(normalizeRotation(currentRot + pageMeta.rotation)));
      }
    }

    const effectiveRot = normalizeRotation(page.getRotation().angle);
    const { width: mbW, height: mbH } = page.getSize();
    const visW = effectiveRot === 90 || effectiveRot === 270 ? mbH : mbW;
    const visH = effectiveRot === 90 || effectiveRot === 270 ? mbW : mbH;

    const pageAnnots = editState.annotations.filter((a) => a.pageId === pageMeta.id);

    for (const annot of pageAnnots) {
      if (annot.type === "text") {
        const boxW = Math.max(30, (annot.width || 0.25) * visW);
        const lineHeight = annot.fontSize * 1.25;
        let usedFallbackPng = false;

        try {
          const font = await getFont(annot.fontFamily || "helvetica", annot.bold, annot.italic);
          // Test encoding first; throws if non-WinAnsi character exists
          font.encodeText(annot.text.replace(/\r?\n/g, " "));

          const lines = wrapTextForPdfFont(annot.text, font, annot.fontSize, boxW - 8);
          const totalH = Math.max(lineHeight + 8, lines.length * lineHeight + 8);

          // Optional background fill box
          if (annot.backgroundColor && annot.backgroundColor !== "transparent") {
            const bgRgb = hexToRgb(annot.backgroundColor);
            const anchor = visualToMediaBox(
              annot.x,
              annot.y + totalH / visH,
              mbW,
              mbH,
              effectiveRot
            );
            page.drawRectangle({
              x: anchor.x,
              y: anchor.y,
              width: boxW,
              height: totalH,
              color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
              opacity: annot.opacity ?? 1,
              rotate: degrees(effectiveRot),
            });
          }

          const textRgb = hexToRgb(annot.color);
          lines.forEach((line, idx) => {
            if (!line) return;
            const textW = font.widthOfTextAtSize(line, annot.fontSize);
            let offsetX = 4;
            if (annot.align === "center") offsetX = Math.max(4, (boxW - textW) / 2);
            else if (annot.align === "right") offsetX = Math.max(4, boxW - textW - 4);

            const vx = annot.x + offsetX / visW;
            const vy = annot.y + (4 + idx * lineHeight + annot.fontSize * 0.9) / visH;
            const pt = visualToMediaBox(vx, vy, mbW, mbH, effectiveRot);

            page.drawText(line, {
              x: pt.x,
              y: pt.y,
              size: annot.fontSize,
              font,
              color: rgb(textRgb.r, textRgb.g, textRgb.b),
              opacity: annot.opacity ?? 1,
              rotate: degrees(effectiveRot),
            });
          });
        } catch {
          usedFallbackPng = true;
        }

        if (usedFallbackPng) {
          const rendered = await renderTextBlockToPng(annot, boxW);
          const embedded = await outDoc.embedPng(rendered.bytes);
          const anchor = visualToMediaBox(
            annot.x,
            annot.y + rendered.heightPt / visH,
            mbW,
            mbH,
            effectiveRot
          );
          page.drawImage(embedded, {
            x: anchor.x,
            y: anchor.y,
            width: rendered.widthPt,
            height: rendered.heightPt,
            rotate: degrees(effectiveRot),
          });
        }
      } else if (annot.type === "shape") {
        const wPt = Math.max(2, annot.width * visW);
        const hPt = Math.max(2, annot.height * visH);
        const hasFill = annot.fillColor && annot.fillColor !== "transparent";
        const fillRgb = hexToRgb(annot.fillColor);
        const strokeRgb = hexToRgb(annot.strokeColor);
        const opacity = annot.opacity ?? 1;

        if (annot.shapeType === "line" || annot.shapeType === "arrow") {
          const sx = annot.flipX ? annot.x + annot.width : annot.x;
          const sy = annot.flipY ? annot.y + annot.height : annot.y;
          const ex = annot.flipX ? annot.x : annot.x + annot.width;
          const ey = annot.flipY ? annot.y : annot.y + annot.height;

          const startPt = visualToMediaBox(sx, sy, mbW, mbH, effectiveRot);
          const endPt = visualToMediaBox(ex, ey, mbW, mbH, effectiveRot);

          page.drawLine({
            start: startPt,
            end: endPt,
            thickness: Math.max(1, annot.strokeWidth || 2),
            color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
            opacity,
          });

          if (annot.shapeType === "arrow") {
            const dx = endPt.x - startPt.x;
            const dy = endPt.y - startPt.y;
            const len = Math.hypot(dx, dy);
            if (len > 4) {
              const angle = Math.atan2(dy, dx);
              const headLen = Math.min(len * 0.35, Math.max(10, (annot.strokeWidth || 2) * 4));
              const spread = Math.PI / 6;

              const leftWing = {
                x: endPt.x - headLen * Math.cos(angle - spread),
                y: endPt.y - headLen * Math.sin(angle - spread),
              };
              const rightWing = {
                x: endPt.x - headLen * Math.cos(angle + spread),
                y: endPt.y - headLen * Math.sin(angle + spread),
              };

              page.drawLine({
                start: endPt,
                end: leftWing,
                thickness: Math.max(1, annot.strokeWidth || 2),
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                opacity,
              });
              page.drawLine({
                start: endPt,
                end: rightWing,
                thickness: Math.max(1, annot.strokeWidth || 2),
                color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
                opacity,
              });
            }
          }
        } else if (annot.shapeType === "circle") {
          const center = visualToMediaBox(
            annot.x + annot.width / 2,
            annot.y + annot.height / 2,
            mbW,
            mbH,
            effectiveRot
          );
          const rx = effectiveRot === 90 || effectiveRot === 270 ? hPt / 2 : wPt / 2;
          const ry = effectiveRot === 90 || effectiveRot === 270 ? wPt / 2 : hPt / 2;

          page.drawEllipse({
            x: center.x,
            y: center.y,
            xScale: rx,
            yScale: ry,
            color: hasFill ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            borderColor: annot.strokeWidth > 0 ? rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b) : undefined,
            borderWidth: annot.strokeWidth > 0 ? annot.strokeWidth : undefined,
            opacity,
            borderOpacity: opacity,
          });
        } else {
          // rect, highlight, whiteout, redact
          const anchor = visualToMediaBox(
            annot.x,
            annot.y + annot.height,
            mbW,
            mbH,
            effectiveRot
          );
          page.drawRectangle({
            x: anchor.x,
            y: anchor.y,
            width: wPt,
            height: hPt,
            color: hasFill ? rgb(fillRgb.r, fillRgb.g, fillRgb.b) : undefined,
            borderColor: annot.strokeWidth > 0 ? rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b) : undefined,
            borderWidth: annot.strokeWidth > 0 ? annot.strokeWidth : undefined,
            opacity,
            borderOpacity: opacity,
            rotate: degrees(effectiveRot),
          });
        }
      } else if (annot.type === "draw" && annot.points.length > 1) {
        const strokeRgb = hexToRgb(annot.color);
        const opacity = annot.opacity ?? 1;
        for (let p = 0; p < annot.points.length - 1; p++) {
          const p1 = visualToMediaBox(
            annot.points[p].x,
            annot.points[p].y,
            mbW,
            mbH,
            effectiveRot
          );
          const p2 = visualToMediaBox(
            annot.points[p + 1].x,
            annot.points[p + 1].y,
            mbW,
            mbH,
            effectiveRot
          );
          page.drawLine({
            start: p1,
            end: p2,
            thickness: Math.max(1, annot.strokeWidth || 2),
            color: rgb(strokeRgb.r, strokeRgb.g, strokeRgb.b),
            opacity,
          });
        }
      } else if (annot.type === "image" && annot.dataUrl) {
        try {
          const parsed = dataUrlToUint8Array(annot.dataUrl);
          let embedded;
          if (parsed.isPng) {
            embedded = await outDoc.embedPng(parsed.bytes);
          } else if (parsed.isJpg) {
            embedded = await outDoc.embedJpg(parsed.bytes);
          } else {
            const pngBytes = await convertDataUrlToPngBytes(annot.dataUrl);
            embedded = await outDoc.embedPng(pngBytes);
          }

          const anchor = visualToMediaBox(
            annot.x,
            annot.y + annot.height,
            mbW,
            mbH,
            effectiveRot
          );
          page.drawImage(embedded, {
            x: anchor.x,
            y: anchor.y,
            width: annot.width * visW,
            height: annot.height * visH,
            opacity: annot.opacity ?? 1,
            rotate: degrees(effectiveRot),
          });
        } catch (err) {
          console.error("Failed to embed image/signature:", err);
        }
      } else if (annot.type === "stamp") {
        try {
          const wPt = annot.width * visW;
          const hPt = annot.height * visH;
          const stampBytes = await renderStampToPng(annot, wPt, hPt);
          const embedded = await outDoc.embedPng(stampBytes);
          const anchor = visualToMediaBox(
            annot.x,
            annot.y + annot.height,
            mbW,
            mbH,
            effectiveRot
          );
          page.drawImage(embedded, {
            x: anchor.x,
            y: anchor.y,
            width: wPt,
            height: hPt,
            rotate: degrees(effectiveRot),
          });
        } catch (err) {
          console.error("Failed to embed stamp:", err);
        }
      }
    }
  }

  const uint8Array = await outDoc.save();
  const blob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });
  return { blob, uint8Array };
}
