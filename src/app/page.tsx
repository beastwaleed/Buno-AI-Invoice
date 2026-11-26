import React from "react";
import type { Metadata } from "next";
import { LandingPageClient } from "@/components/landing/LandingPageClient";

export const metadata: Metadata = {
  title: "Buno — Precision Invoicing for Modern Studios & Builders",
  description:
    "Deterministic multi-currency calculations, multilingual voice input, and 11 bespoke typographic invoice templates. Free, open source, and production ready.",
};

export default function LandingPage() {
  return <LandingPageClient />;
}
