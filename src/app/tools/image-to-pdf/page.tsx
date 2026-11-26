import React from "react";
import { Metadata } from "next";
import { ImageToPdfClient } from "@/components/tools/ImageToPdfClient";

export const metadata: Metadata = {
  title: "Convert Images to PDF Free | JPG, PNG, WebP to PDF | Buno",
  description:
    "Convert multiple JPG, PNG, or WebP images into a high-quality multi-page PDF document with custom margins and orientations.",
};

export default function ImageToPdfPage() {
  return <ImageToPdfClient />;
}
