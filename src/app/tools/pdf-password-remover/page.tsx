import React from "react";
import { Metadata } from "next";
import dynamic from "next/dynamic";

const UnlockPdfClient = dynamic(
  () => import("@/components/tools/UnlockPdfClient").then((m) => m.UnlockPdfClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading PDF Unlocker...</p>
        </div>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "PDF Password Remover & Unlocker Free | Buno PDF Tools",
  description:
    "Permanently unlock password-protected PDFs and remove printing, copying, and editing restrictions with 100% in-browser privacy.",
};

export default function UnlockPdfPage() {
  return <UnlockPdfClient />;
}
