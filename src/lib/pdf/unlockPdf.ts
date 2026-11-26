import { PDFDocument } from "pdf-lib";

export interface UnlockPdfResult {
  unlockedBlob: Blob;
  uint8Array: Uint8Array;
  pageCount: number;
  unlockedType: "permissions" | "password";
}

/**
 * Checks if a PDF is encrypted or has password protection.
 */
export async function inspectPdfProtection(
  file: File
): Promise<{ isProtected: boolean; requiresPassword: boolean }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // Try standard load without ignoreEncryption
    await PDFDocument.load(arrayBuffer);
    // If it loads without error, it's not open-password protected
    return { isProtected: false, requiresPassword: false };
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    // Check if it's protected by password
    if (
      msg.includes("encrypt") ||
      msg.includes("password") ||
      msg.includes("decrypt") ||
      msg.includes("security")
    ) {
      return { isProtected: true, requiresPassword: true };
    }

    // Attempt loading with ignoreEncryption to see if it's owner-locked
    try {
      const arrayBuffer = await file.arrayBuffer();
      await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      return { isProtected: true, requiresPassword: false };
    } catch {
      return { isProtected: true, requiresPassword: true };
    }
  }
}

/**
 * Strips owner restrictions or decrypts with provided password to produce a fully unlocked PDF.
 */
export async function unlockPdfDocument(
  file: File,
  password?: string
): Promise<UnlockPdfResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Try 1: Strip owner encryption / permissions restriction with pdf-lib directly
  if (!password) {
    try {
      const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();
      const pages = await newDoc.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => newDoc.addPage(p));
      const uint8Array = await newDoc.save();
      const unlockedBlob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });
      return {
        unlockedBlob,
        uint8Array,
        pageCount: pages.length,
        unlockedType: "permissions",
      };
    } catch (err: any) {
      // Needs open password
      throw new Error("This PDF is protected by an open password. Please enter the password.");
    }
  }

  // Try 2: Unlock user-password protected PDF using pdfjs-dist
  const pdfjsLib = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    password: password || "",
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  // Render decrypted pages to high-res canvases and assemble a clean unencrypted PDF
  const outputDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x crispness

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let k = 0; k < binary.length; k++) {
      bytes[k] = binary.charCodeAt(k);
    }

    const embeddedJpg = await outputDoc.embedJpg(bytes);
    const pdfPage = outputDoc.addPage([viewport.width / 2, viewport.height / 2]);
    pdfPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: viewport.width / 2,
      height: viewport.height / 2,
    });
  }

  const uint8Array = await outputDoc.save();
  const unlockedBlob = new Blob([uint8Array as unknown as BlobPart], { type: "application/pdf" });

  return {
    unlockedBlob,
    uint8Array,
    pageCount: numPages,
    unlockedType: "password",
  };
}
