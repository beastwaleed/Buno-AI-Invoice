import { PDFDocument } from "pdf-lib";

export interface MergePdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

/**
 * Merges multiple PDF files into one single PDF document.
 * Runs 100% client-side in the user's browser.
 */
export async function mergePdfFiles(
  files: (File | ArrayBuffer)[],
  onProgress?: (progress: number, current: number, total: number) => void
): Promise<{ blob: Blob; uint8Array: Uint8Array; pageCount: number }> {
  if (!files || files.length === 0) {
    throw new Error("No PDF files provided to merge.");
  }

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    const item = files[i];
    const arrayBuffer = item instanceof File ? await item.arrayBuffer() : item;
    const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    
    copiedPages.forEach((page) => {
      mergedPdf.addPage(page);
    });
    totalPages += copiedPages.length;

    if (onProgress) {
      onProgress(Math.round(((i + 1) / files.length) * 100), i + 1, files.length);
    }
  }

  const uint8Array = await mergedPdf.save();
  const blob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });

  return { blob, uint8Array, pageCount: totalPages };
}

/**
 * Returns the page count of a PDF file quickly without full rendering.
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    return doc.getPageCount();
  } catch {
    return 1;
  }
}
