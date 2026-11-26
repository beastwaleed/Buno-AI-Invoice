import React from "react";
import { InvoiceData, TemplateDefinition, InvoiceFontSizeConfig, InvoiceTableConfig } from "@/types/invoice";
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
  tableConfig?: InvoiceTableConfig;
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  invoice,
  templateId,
  accentColor,
  fontSizeConfig,
  tableConfig,
}) => {
  const selectedTemplate = templateId || invoice.templateId || "classic";

  const fontSizes = fontSizeConfig || invoice.fontSizeConfig || {};
  const tblConfig = tableConfig || invoice.tableConfig || {};

  const headerScale = fontSizes.header || 1.0;
  const bodyScale = fontSizes.body || 1.0;
  const tableScale = tblConfig.fontSize || fontSizes.table || 1.0;
  const totalScale = fontSizes.total || 1.0;
  const logoScale = fontSizes.logo || 1.0;
  const customScales = fontSizes.custom || {};

  const densityPadding =
    tblConfig.rowDensity === "compact"
      ? "0.32rem 0.5rem"
      : tblConfig.rowDensity === "relaxed"
      ? "0.95rem 0.75rem"
      : "0.625rem 0.625rem";

  const colWidthRules = (tblConfig.columnWidths && tblConfig.columnWidths.length > 0)
    ? tblConfig.columnWidths.map((w, idx) => `
      .invoice-render-wrapper table th:nth-child(${idx + 1}),
      .invoice-render-wrapper table td:nth-child(${idx + 1}),
      .invoice-render-wrapper table col:nth-child(${idx + 1}) {
        width: ${w}% !important;
        max-width: ${w}% !important;
      }
    `).join("\n")
    : "";

  const customTextRules = Object.entries(customScales)
    .map(([key, scale]) => `
      .invoice-render-wrapper [data-invoice-text="${key}"] {
        --el-scale: ${scale} !important;
        --cat-scale: ${scale} !important;
      }
    `)
    .join("\n");

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
            .invoice-render-wrapper [data-invoice-cat="logo"] { --logo-scale: ${logoScale}; }

            /* Granular individual text scaling */
            .invoice-render-wrapper [data-invoice-text] {
              --el-scale: 1;
              font-size: calc(1em * var(--el-scale, 1));
              transition: font-size 0.05s ease-out;
            }

            ${customTextRules}

            .invoice-render-wrapper [data-invoice-text].text-4xl, .invoice-render-wrapper [data-invoice-text] .text-4xl { font-size: calc(2.25rem * var(--el-scale, 1)) !important; line-height: calc(2.5rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-3xl, .invoice-render-wrapper [data-invoice-text] .text-3xl { font-size: calc(1.875rem * var(--el-scale, 1)) !important; line-height: calc(2.25rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-2xl, .invoice-render-wrapper [data-invoice-text] .text-2xl { font-size: calc(1.5rem * var(--el-scale, 1)) !important; line-height: calc(2rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-xl, .invoice-render-wrapper [data-invoice-text] .text-xl { font-size: calc(1.25rem * var(--el-scale, 1)) !important; line-height: calc(1.75rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-lg, .invoice-render-wrapper [data-invoice-text] .text-lg { font-size: calc(1.125rem * var(--el-scale, 1)) !important; line-height: calc(1.75rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-base, .invoice-render-wrapper [data-invoice-text] .text-base { font-size: calc(1rem * var(--el-scale, 1)) !important; line-height: calc(1.5rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-sm, .invoice-render-wrapper [data-invoice-text] .text-sm { font-size: calc(0.875rem * var(--el-scale, 1)) !important; line-height: calc(1.25rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-xs, .invoice-render-wrapper [data-invoice-text] .text-xs { font-size: calc(0.75rem * var(--el-scale, 1)) !important; line-height: calc(1rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-\\[11px\\], .invoice-render-wrapper [data-invoice-text] .text-\\[11px\\] { font-size: calc(0.6875rem * var(--el-scale, 1)) !important; line-height: calc(0.95rem * var(--el-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-text].text-\\[10px\\], .invoice-render-wrapper [data-invoice-text] .text-\\[10px\\] { font-size: calc(0.625rem * var(--el-scale, 1)) !important; line-height: calc(0.85rem * var(--el-scale, 1)) !important; }

            /* Logo dynamic scaling */
            .invoice-render-wrapper [data-invoice-cat="logo"] img,
            .invoice-render-wrapper img[data-invoice-logo="true"] {
              height: calc(3.2rem * var(--logo-scale, 1)) !important;
              max-height: calc(8rem * var(--logo-scale, 1)) !important;
              width: auto !important;
              max-width: calc(20rem * var(--logo-scale, 1)) !important;
              object-fit: contain !important;
              transition: height 0.08s ease-out, max-height 0.08s ease-out;
            }

            /* Category fallback scaling */
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-4xl { font-size: calc(2.25rem * var(--cat-scale, 1)) !important; line-height: calc(2.5rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-3xl { font-size: calc(1.875rem * var(--cat-scale, 1)) !important; line-height: calc(2.25rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-2xl { font-size: calc(1.5rem * var(--cat-scale, 1)) !important; line-height: calc(2rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-xl { font-size: calc(1.25rem * var(--cat-scale, 1)) !important; line-height: calc(1.75rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-lg { font-size: calc(1.125rem * var(--cat-scale, 1)) !important; line-height: calc(1.75rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-base { font-size: calc(1rem * var(--cat-scale, 1)) !important; line-height: calc(1.5rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-sm { font-size: calc(0.875rem * var(--cat-scale, 1)) !important; line-height: calc(1.25rem * var(--cat-scale, 1)) !important; }
            .invoice-render-wrapper [data-invoice-cat]:not([data-invoice-text]) .text-xs { font-size: calc(0.75rem * var(--cat-scale, 1)) !important; line-height: calc(1rem * var(--cat-scale, 1)) !important; }

            /* MS Word Table Layout & Density */
            .invoice-render-wrapper table {
              table-layout: fixed !important;
              width: 100% !important;
            }
            .invoice-render-wrapper table th,
            .invoice-render-wrapper table td {
              padding: ${densityPadding} !important;
              overflow-wrap: break-word !important;
              word-break: break-word !important;
            }
            .invoice-render-wrapper [data-invoice-cat="table"] table th,
            .invoice-render-wrapper [data-invoice-cat="table"] table td {
              font-size: calc(0.75rem * var(--cat-scale, 1));
            }

            ${colWidthRules}

            /* Interactive Selection & Hover Feedback */
            #invoice-preview-document [data-invoice-text],
            #invoice-preview-document [data-invoice-cat="logo"],
            #invoice-preview-document [data-invoice-cat="table"] {
              cursor: pointer;
              transition: outline 0.12s ease-in-out;
            }
            #invoice-preview-document [data-invoice-text]:hover {
              outline: 1.5px dashed rgba(59, 130, 246, 0.55);
              outline-offset: 2px;
              border-radius: 3px;
            }
            #invoice-preview-document [data-invoice-cat="logo"]:hover {
              outline: 1.5px dashed rgba(59, 130, 246, 0.55);
              outline-offset: 4px;
              border-radius: 4px;
            }
            #invoice-preview-document [data-invoice-cat="table"]:hover {
              outline: 1.5px dashed rgba(99, 102, 241, 0.35);
              outline-offset: 3px;
            }
            @media print {
              #invoice-preview-document [data-invoice-text],
              #invoice-preview-document [data-invoice-cat],
              #invoice-preview-document table {
                outline: none !important;
                cursor: default !important;
              }
            }
          `,
        }}
      />
      {renderTemplateContent()}
    </div>
  );
};
