import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export interface PdfAnnotationText {
  id: string;
  type: "text";
  pageIndex: number;
  x: number; // 0 to 1 relative to page width
  y: number; // 0 to 1 relative to page height
  text: string;
  fontSize: number;
  color: string; // hex #000000
}

export interface PdfAnnotationDraw {
  id: string;
  type: "draw";
  pageIndex: number;
  points: { x: number; y: number }[]; // relative 0 to 1
  color: string;
  strokeWidth: number;
}

export interface PdfAnnotationRect {
  id: string;
  type: "rect";
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
}

export interface PdfAnnotationSignature {
  id: string;
  type: "signature";
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export type PdfAnnotation =
  | PdfAnnotationText
  | PdfAnnotationDraw
  | PdfAnnotationRect
  | PdfAnnotationSignature;

export interface PdfEditState {
  annotations: PdfAnnotation[];
  pageRotations: Record<number, number>; // pageIndex -> rotation in degrees
  deletedPages: number[]; // indices of deleted pages
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
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

/**
 * Applies all user annotations, drawings, signatures, rotations, and page deletions
 * onto the PDF and outputs a new saved PDF document.
 */
export async function applyPdfEdits(
  originalPdfBytes: ArrayBuffer,
  editState: PdfEditState
): Promise<{ blob: Blob; uint8Array: Uint8Array }> {
  const pdfDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 1. Apply page deletions in descending index order
  const sortedDeletions = [...editState.deletedPages].sort((a, b) => b - a);
  for (const pageIdx of sortedDeletions) {
    if (pageIdx >= 0 && pageIdx < pdfDoc.getPageCount() && pdfDoc.getPageCount() > 1) {
      pdfDoc.removePage(pageIdx);
    }
  }

  const pages = pdfDoc.getPages();

  // 2. Apply page rotations
  for (let i = 0; i < pages.length; i++) {
    const rot = editState.pageRotations[i];
    if (rot) {
      const page = pages[i];
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + rot) % 360));
    }
  }

  // 3. Apply annotations
  for (const annot of editState.annotations) {
    if (annot.pageIndex >= pages.length) continue;
    const page = pages[annot.pageIndex];
    const { width, height } = page.getSize();

    if (annot.type === "text") {
      const color = hexToRgb(annot.color);
      // In PDF coordinate system, Y=0 is at bottom
      const pdfX = annot.x * width;
      const pdfY = height - annot.y * height - annot.fontSize;

      page.drawText(annot.text, {
        x: pdfX,
        y: Math.max(0, pdfY),
        size: annot.fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    } else if (annot.type === "rect") {
      const color = hexToRgb(annot.color);
      const pdfX = annot.x * width;
      const pdfW = annot.width * width;
      const pdfH = annot.height * height;
      const pdfY = height - annot.y * height - pdfH;

      page.drawRectangle({
        x: pdfX,
        y: Math.max(0, pdfY),
        width: pdfW,
        height: pdfH,
        color: rgb(color.r, color.g, color.b),
        opacity: annot.opacity ?? 0.4,
      });
    } else if (annot.type === "signature" && annot.dataUrl) {
      try {
        const base64 = annot.dataUrl.split(",")[1];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let k = 0; k < binary.length; k++) {
          bytes[k] = binary.charCodeAt(k);
        }

        const embeddedPng = await pdfDoc.embedPng(bytes);
        const pdfX = annot.x * width;
        const pdfW = annot.width * width;
        const pdfH = annot.height * height;
        const pdfY = height - annot.y * height - pdfH;

        page.drawImage(embeddedPng, {
          x: pdfX,
          y: Math.max(0, pdfY),
          width: pdfW,
          height: pdfH,
        });
      } catch (err) {
        console.error("Failed to embed signature:", err);
      }
    } else if (annot.type === "draw" && annot.points.length > 1) {
      // Connect points with line segments
      const color = hexToRgb(annot.color);
      for (let p = 0; p < annot.points.length - 1; p++) {
        const p1 = annot.points[p];
        const p2 = annot.points[p + 1];
        page.drawLine({
          start: { x: p1.x * width, y: height - p1.y * height },
          end: { x: p2.x * width, y: height - p2.y * height },
          thickness: annot.strokeWidth || 2,
          color: rgb(color.r, color.g, color.b),
        });
      }
    }
  }

  const uint8Array = await pdfDoc.save();
  const blob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });

  return { blob, uint8Array };
}
