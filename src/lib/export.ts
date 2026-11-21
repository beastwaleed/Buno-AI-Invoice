import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export interface ExportOptions {
  filename?: string;
  elementId?: string;
  quality?: number;
}

/**
 * Generates and downloads a high-resolution PDF of the invoice document.
 */
export async function exportToPdf(options: ExportOptions = {}) {
  const { elementId = "invoice-preview-document", filename = "invoice.pdf" } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    toast.error("Invoice document element not found for PDF export.");
    return;
  }

  const toastId = toast.loading("Generating high-resolution PDF...");

  try {
    // Render element to high-res PNG data url (pixel ratio 2 for crisp print quality)
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio: 2.5,
      backgroundColor: "#FFFFFF",
      cacheBust: true,
      filter: (node: HTMLElement) => {
        // Exclude any interactive zoom or edit controls if inside
        return !node.classList?.contains("no-export");
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Create an image to get natural dimensions
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidth = pdfWidth;
    const imgHeight = (img.height * pdfWidth) / img.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(dataUrl, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
    } else {
      // Multi-page handling: slice if height exceeds single A4 page
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }
    }

    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    toast.success("PDF successfully downloaded!", { id: toastId });
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error("Could not generate PDF. Please try again.", { id: toastId });
  }
}

/**
 * Generates and downloads a 2x/3x high-resolution PNG image of the invoice.
 */
export async function exportToPng(options: ExportOptions = {}) {
  const { elementId = "invoice-preview-document", filename = "invoice.png" } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    toast.error("Invoice document element not found for image export.");
    return;
  }

  const toastId = toast.loading("Generating PNG image...");

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2.5,
      backgroundColor: "#FFFFFF",
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("PNG image downloaded!", { id: toastId });
  } catch (error) {
    console.error("PNG export error:", error);
    toast.error("Could not generate PNG image.", { id: toastId });
  }
}

/**
 * Generates and downloads a compact JPEG image of the invoice.
 */
export async function exportToJpeg(options: ExportOptions = {}) {
  const {
    elementId = "invoice-preview-document",
    filename = "invoice.jpg",
    quality = 0.95,
  } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    toast.error("Invoice document element not found for image export.");
    return;
  }

  const toastId = toast.loading("Generating JPEG image...");

  try {
    const dataUrl = await toJpeg(element, {
      quality,
      pixelRatio: 2,
      backgroundColor: "#FFFFFF",
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.download = filename.endsWith(".jpg") ? filename : `${filename}.jpg`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("JPEG image downloaded!", { id: toastId });
  } catch (error) {
    console.error("JPEG export error:", error);
    toast.error("Could not generate JPEG image.", { id: toastId });
  }
}

/**
 * Triggers native browser print formatted specifically for A4 invoice layout.
 */
export function triggerPrint() {
  window.print();
}
