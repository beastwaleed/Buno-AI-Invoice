import React from "react";
import { Metadata } from "next";
import { MergePdfClient } from "@/components/tools/MergePdfClient";

export const metadata: Metadata = {
  title: "Merge PDF Files Free & Online | Buno PDF Tools",
  description:
    "Combine multiple PDF documents into one single file with customizable page ordering. 100% free and in-browser.",
};

export default function MergePdfPage() {
  return <MergePdfClient />;
}
