import React from "react";
import { InvoiceData, TemplateDefinition, InvoiceFontSizeConfig } from "@/types/invoice";
import { ClassicTemplate } from "./ClassicTemplate";
import { MinimalTemplate } from "./MinimalTemplate";
import { CorporateTemplate } from "./CorporateTemplate";
import { CompactTemplate } from "./CompactTemplate";
import { WaveTemplate } from "./WaveTemplate";
import { AmberGridTemplate } from "./AmberGridTemplate";
import { CrimsonTemplate } from "./CrimsonTemplate";
import { RoyalBlueTemplate } from "./RoyalBlueTemplate";
import { AgencySidebarTemplate } from "./AgencySidebarTemplate";

// 9 Production Templates (Classic Ledger is default)
export const TEMPLATE_LIST: TemplateDefinition[] = [
  {
    slug: "classic",
    name: "Classic Ledger",
    description: "Traditional business invoice with formal framing, ruled lines, and boxed summary.",
    accentColor: "#334155",
    fontStyle: "serif",
  },
  {
    slug: "minimal",
    name: "Pure Minimal",
    description: "Monochrome, ultra-clean, generous whitespace and subtle borders.",
    accentColor: "#202124",
    fontStyle: "sans",
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
  fontSizeConfig?: InvoiceFontSizeConfig;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  invoice,
  templateId,
  accentColor,
  fontSizeConfig,
}) => {
  const selectedTemplate = templateId || invoice.templateId || "classic";

  const fontSizes = fontSizeConfig || invoice.fontSizeConfig || {};
  const headerScale = fontSizes.header || 1.0;
  const bodyScale = fontSizes.body || 1.0;
  const tableScale = fontSizes.table || 1.0;
  const totalScale = fontSizes.total || 1.0;

  const renderTemplateContent = () => {
    switch (selectedTemplate.toLowerCase()) {
      case "minimal":
        return <MinimalTemplate invoice={invoice} accentColor={accentColor} />;
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
      case "classic":
      default:
        return <ClassicTemplate invoice={invoice} accentColor={accentColor} />;
    }
  };

  return (
    <div className="invoice-render-wrapper w-full relative">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .invoice-render-wrapper [data-invoice-cat="header"] { --cat-scale: ${headerScale}; }
            .invoice-render-wrapper [data-invoice-cat="body"] { --cat-scale: ${bodyScale}; }
            .invoice-render-wrapper [data-invoice-cat="table"] { --cat-scale: ${tableScale}; }
            .invoice-render-wrapper [data-invoice-cat="total"] { --cat-scale: ${totalScale}; }

            .invoice-render-wrapper [data-invoice-cat] .text-4xl { font-size: calc(2.25rem * var(--cat-scale, 1)) !important; line-height: calc(2.5rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-3xl { font-size: calc(1.875rem * var(--cat-scale, 1)) !important; line-height: calc(2.25rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-2xl { font-size: calc(1.5rem * var(--cat-scale, 1)) !important; line-height: calc(2rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-xl { font-size: calc(1.25rem * var(--cat-scale, 1)) !important; line-height: calc(1.75rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-lg { font-size: calc(1.125rem * var(--cat-scale, 1)) !important; line-height: calc(1.75rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-base { font-size: calc(1rem * var(--cat-scale, 1)) !important; line-height: calc(1.5rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-sm { font-size: calc(0.875rem * var(--cat-scale, 1)) !important; line-height: calc(1.25rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-xs { font-size: calc(0.75rem * var(--cat-scale, 1)) !important; line-height: calc(1rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat] .text-\\[11px\\],
            .invoice-render-wrapper [data-invoice-cat] .text-\\[10px\\],
            .invoice-render-wrapper [data-invoice-cat] .text-\\[9px\\] {
              font-size: calc(0.6875rem * var(--cat-scale, 1)) !important;
              line-height: calc(0.95rem * var(--cat-scale, 1)) !important;
            }

            .invoice-render-wrapper [data-invoice-cat="table"] table th,
            .invoice-render-wrapper [data-invoice-cat="table"] table td {
              font-size: calc(0.75rem * var(--cat-scale, 1));
            }
          `,
        }}
      />
      {renderTemplateContent()}
    </div>
  );
};
