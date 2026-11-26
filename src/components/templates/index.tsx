import React from "react";
import { InvoiceData, TemplateDefinition } from "@/types/invoice";
import { ModernTemplate } from "./ModernTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { ClassicTemplate } from "./ClassicTemplate";
import { ElegantTemplate } from "./ElegantTemplate";
import { CorporateTemplate } from "./CorporateTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { WaveTemplate } from "./WaveTemplate";
import { AmberGridTemplate } from "./AmberGridTemplate";
import { CrimsonTemplate } from "./CrimsonTemplate";
import { RoyalBlueTemplate } from "./RoyalBlueTemplate";
import { AgencySidebarTemplate } from "./AgencySidebarTemplate";

export const TEMPLATE_LIST: TemplateDefinition[] = [
  {
    slug: "modern",
    name: "Modern Studio",
    description: "Restrained cool blue accent, clean hierarchy, badge status, balanced grid.",
    accentColor: "#4468E8",
    fontStyle: "sans",
  },
  {
    slug: "minimal",
    name: "Pure Minimal",
    description: "Monochrome, ultra-clean, generous whitespace and subtle borders.",
    accentColor: "#202124",
    fontStyle: "sans",
  },
  {
    slug: "classic",
    name: "Classic Ledger",
    description: "Traditional business invoice with formal framing, ruled lines, and boxed summary.",
    accentColor: "#334155",
    fontStyle: "serif",
  },
  {
    slug: "elegant",
    name: "Editorial Serif",
    description: "Sophisticated Playfair serif typography with warm ivory accents and timeless styling.",
    accentColor: "#1E293B",
    fontStyle: "serif",
  },
  {
    slug: "corporate",
    name: "Corporate Enterprise",
    description: "Structured metadata grid, enterprise reference badges, and formal payment section.",
    accentColor: "#1E3A5F",
    fontStyle: "sans",
  },
  {
    slug: "compact",
    name: "High-Density Compact",
    description: "Condensed row height, optimized for invoices with many products and services.",
    accentColor: "#475569",
    fontStyle: "sans",
  },
  // Custom & High-Craft Templates:
  {
    slug: "wave",
    name: "Wave Minimal",
    description: "Organic wave curve footer, bold typography, and modern itemized billing.",
    accentColor: "#334155",
    fontStyle: "sans",
  },
  {
    slug: "amber-grid",
    name: "Amber Grid",
    description: "High-contrast amber table header with boxed grid structure and summary pill.",
    accentColor: "#FFD700",
    fontStyle: "sans",
  },
  {
    slug: "crimson",
    name: "Executive Crimson",
    description: "Executive crimson header banner, deep navy palette, and formal authorization stamp.",
    accentColor: "#D91B24",
    fontStyle: "sans",
  },
  {
    slug: "royal-blue",
    name: "Royal Blue SaaS",
    description: "Royal blue brand banner, five-column breakdown, and structured payment terms.",
    accentColor: "#00338D",
    fontStyle: "sans",
  },
  {
    slug: "agency-sidebar",
    name: "Agency Sidebar",
    description: "Charcoal brand sidebar with rounded geometry, warm accents, and total badge.",
    accentColor: "#E06D38",
    fontStyle: "sans",
  },
];

interface InvoiceRendererProps {
  invoice: InvoiceData;
  templateId?: string;
  accentColor?: string;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  invoice,
  templateId,
  accentColor,
}) => {
  const selectedTemplate = templateId || invoice.templateId || "modern";

  switch (selectedTemplate.toLowerCase()) {
    case "minimal":
      return <MinimalTemplate invoice={invoice} accentColor={accentColor} />;
    case "classic":
      return <ClassicTemplate invoice={invoice} accentColor={accentColor} />;
    case "elegant":
      return <ElegantTemplate invoice={invoice} accentColor={accentColor} />;
    case "corporate":
      return <CorporateTemplate invoice={invoice} accentColor={accentColor} />;
    case "compact":
      return <CompactTemplate invoice={invoice} accentColor={accentColor} />;
    case "wave":
      return <WaveTemplate invoice={invoice} accentColor={accentColor} />;
    case "amber-grid":
      return <AmberGridTemplate invoice={invoice} accentColor={accentColor} />;
    case "crimson":
      return <CrimsonTemplate invoice={invoice} accentColor={accentColor} />;
    case "royal-blue":
      return <RoyalBlueTemplate invoice={invoice} accentColor={accentColor} />;
    case "agency-sidebar":
      return <AgencySidebarTemplate invoice={invoice} accentColor={accentColor} />;
    case "modern":
    default:
      return <ModernTemplate invoice={invoice} accentColor={accentColor} />;
  }
};
