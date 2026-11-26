import { PDFDocument } from "pdf-lib";

export interface ImageToPdfItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  rotation?: number; // 0, 90, 180, 270
}

export interface ImageToPdfOptions {
  pageSize?: "a4" | "letter" | "fit";
  orientation?: "portrait" | "landscape" | "auto";
  margin?: "none" | "small" | "normal";
}

// Standard dimensions in points (72 points = 1 inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612.0, height: 792.0 },
};

const MARGINS = {
  none: 0,
  small: 20, // ~7mm
  normal: 40, // ~14mm
};

/**
 * Normalizes any image (JPG, PNG, WebP, GIF, SVG) to PNG or JPEG array buffer.
 */
async function getNormalizedImageBytes(
  file: File,
  rotation = 0
): Promise<{ bytes: Uint8Array; format: "png" | "jpeg"; width: number; height: number }> {
  const isJpg = file.type === "image/jpeg" || file.type === "image/jpg";
  const isPng = file.type === "image/png";

  // If no rotation and standard format, read directly
  if (rotation === 0 && (isJpg || isPng)) {
    const arrayBuffer = await file.arrayBuffer();
    // Get dimensions via an Image element
    const img = await loadImageElement(URL.createObjectURL(file));
    return {
      bytes: new Uint8Array(arrayBuffer),
      format: isJpg ? "jpeg" : "png",
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    };
  }

  // Draw onto canvas to apply rotation and convert WebP/GIF/SVG to PNG
  const imgUrl = URL.createObjectURL(file);
  const img = await loadImageElement(imgUrl);
  URL.revokeObjectURL(imgUrl);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const isRotated90or270 = rotation % 180 !== 0;
  canvas.width = isRotated90or270 ? origH : origW;
  canvas.height = isRotated90or270 ? origW : origH;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -origW / 2, -origH / 2);

  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return {
    bytes,
    format: "png",
    width: canvas.width,
    height: canvas.height,
  };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Converts multiple image files into a single structured PDF document.
 */
export async function convertImagesToPdf(
  items: ImageToPdfItem[],
  options: ImageToPdfOptions = {},
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<{ blob: Blob; uint8Array: Uint8Array; pageCount: number }> {
  if (!items || items.length === 0) {
    throw new Error("No images provided to convert.");
  }

  const {
    pageSize = "a4",
    orientation = "auto",
    margin = "none",
  } = options;

  const pdfDoc = await PDFDocument.create();
  const marginPt = MARGINS[margin];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const { bytes, format, width: imgW, height: imgH } = await getNormalizedImageBytes(
      item.file,
      item.rotation || 0
    );

    const embeddedImage =
      format === "jpeg"
        ? await pdfDoc.embedJpg(bytes)
        : await pdfDoc.embedPng(bytes);

    let pageWidth: number;
    let pageHeight: number;

    if (pageSize === "fit") {
      // Fit page exactly to image dimensions + margin
      pageWidth = imgW + marginPt * 2;
      pageHeight = imgH + marginPt * 2;
    } else {
      const base = PAGE_SIZES[pageSize];
      let isLandscape = false;

      if (orientation === "auto") {
        isLandscape = imgW > imgH;
      } else if (orientation === "landscape") {
        isLandscape = true;
      }

      pageWidth = isLandscape ? Math.max(base.width, base.height) : Math.min(base.width, base.height);
      pageHeight = isLandscape ? Math.min(base.width, base.height) : Math.max(base.width, base.height);
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image fitting inside printable area
    const printableW = Math.max(10, pageWidth - marginPt * 2);
    const printableH = Math.max(10, pageHeight - marginPt * 2);

    const scale = Math.min(printableW / imgW, printableH / imgH, 1);
    const finalW = imgW * scale;
    const finalH = imgH * scale;

    // Center image on page
    const posX = marginPt + (printableW - finalW) / 2;
    const posY = marginPt + (printableH - finalH) / 2;

    page.drawImage(embeddedImage, {
      x: posX,
      y: posY,
      width: finalW,
      height: finalH,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / items.length) * 100), i + 1, items.length);
    }
  }

  const uint8Array = await pdfDoc.save();
  const blob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });

  return { blob, uint8Array, pageCount: items.length };
}
