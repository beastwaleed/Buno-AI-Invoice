import React from "react";
import { Metadata } from "next";
import { ToolsHubClient } from "@/components/tools/ToolsHubClient";

export const metadata: Metadata = {
  title: "Free PDF Utilities & Tools Suite | Buno",
  description:
    "Merge PDFs, remove PDF passwords, edit PDF documents, and convert images to PDF completely free with 100% in-browser privacy.",
};

export default function ToolsHubPage() {
  return <ToolsHubClient />;
}
