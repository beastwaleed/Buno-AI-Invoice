import React from "react";
import { Metadata } from "next";
import dynamic from "next/dynamic";

const PdfEditorClient = dynamic(
  () => import("@/components/tools/PdfEditorClient").then((m) => m.PdfEditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading PDF Editor...</p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Free Online PDF Editor | Annotate, Sign & Edit PDFs | Buno",
  description:
    "Edit PDFs directly in your browser. Add text, freehand drawings, stamps, signatures, and rotate or delete pages with zero sign-up.",
};

export default function PdfEditorPage() {
  return <PdfEditorClient />;
}
