# Buno Custom Invoice Template Reference System

Welcome to the **Buno Invoice Template Engine**. This directory allows users, designers, and administrators to provide custom invoice templates (screenshots, design mockups, scanned PDFs, or Figma exports) to be converted into fully functional, responsive, real-time editable invoice templates.

---

## Directory Structure

```text
public/
  template-references/
    README.md
    uploaded-references/        <-- Drop your reference files here (PNG, JPG, PDF, SVG)
```

---

## How to Add a New Custom Invoice Template

When you want to add a new invoice template from a visual reference:

### Step 1: Place Your Reference File
Save your image or document into:
`public/template-references/uploaded-references/your-template-name.png` (or `.jpg`, `.pdf`)

### Step 2: Inspection & Design Extraction
Analyze the reference for:
1. **Header Structure**: Left-aligned, split column, centered, or banner style.
2. **Typography**: Serif vs sans-serif headers, font weights, letter spacing, and line heights.
3. **Color Accents**: Primary brand accent, table header fill, rule colors, badge tints.
4. **Table Styling**: Grid lines, zebra rows, minimalist rule dividers, or framed borders.
5. **Totals Section**: Right-aligned stack, boxed summary, full-width ledger bar.
6. **Footer / Payment Notes**: Bank details layout, terms positioning, signature line.

### Step 3: Implement Reusable Component
Create a new template component under `src/components/templates/YourTemplate.tsx`.
All templates implement the standardized `TemplateProps` interface:
```typescript
import { InvoiceData } from "@/types/invoice";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
  isPrint?: boolean;
}
```

### Step 4: Register in Template Registry
Add your new template to `src/components/templates/index.ts`:
```typescript
import { YourTemplate } from "./YourTemplate";

export const TEMPLATES = {
  // ... existing templates
  "your-template": YourTemplate,
};
```

### Step 5: Automatic Support
Once registered, the new template automatically gains:
- **Live Real-time Preview** in the invoice builder.
- **High-Resolution PDF Export** via `@react-pdf` / `jsPDF`.
- **High-DPI PNG and JPEG Image Export** via `html-to-image`.
- **Browser Print Rendering** with `@media print` pagination.
- **Responsive Mobile View**.

---

## Built-in Templates Included in Buno

1. **Modern Studio (`modern`)**: Restrained cool-blue accent, clean hierarchy, badge status, balanced grid.
2. **Pure Minimal (`minimal`)**: Monochrome, ultra-clean, generous whitespace, sharp lines.
3. **Classic Ledger (`classic`)**: Traditional business layout, formal framed table, ruled lines.
4. **Editorial Serif (`elegant`)**: Sophisticated Playfair serif typography with warm ivory accents.
5. **Corporate Enterprise (`corporate`)**: Structured metadata grid, enterprise reference badges, formal payment block.
6. **High-Density Compact (`compact`)**: High density, condensed line items, optimized for many products.
