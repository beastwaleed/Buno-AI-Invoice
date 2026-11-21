# Buno Design System (MASTER)

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules override this Master file. Otherwise, strictly follow the rules below.

---

**Project:** Buno — Premium AI Invoice Generator SaaS  
**Style:** Editorial Swiss & Minimalist Light Theme  
**Primary Aesthetic:** Warm ivory/white surfaces, clean cards, restrained cool-blue accents, sophisticated serif headings, and modern sans-serif body.

---

## 1. Global Tokens

### Color Palette

| Token | Hex | CSS Variable | Purpose |
|-------|-----|--------------|---------|
| **Background** | `#FAFAF8` | `--color-background` | Warm white / ivory surface |
| **Card / Surface** | `#FFFFFF` | `--color-card` | Crisp pure white card background |
| **Foreground / Primary Text**| `#202124` | `--color-foreground` | Deep slate/charcoal for high-contrast reading |
| **Secondary / Muted Text** | `#70757A` | `--color-muted-foreground` | Elegant neutral for subtitles and labels |
| **Border** | `#E8E8E5` | `--color-border` | Subtle warm-gray border |
| **Primary Accent** | `#4468E8` | `--color-primary` | Restrained cool blue for primary CTAs and active states |
| **Accent Hover** | `#3455D1` | `--color-primary-hover` | Deepened cool blue on interaction |
| **Accent Subtle** | `#EEF2FF` | `--color-accent-subtle` | Pale blue background for badges, active tabs, subtle highlights |
| **Success** | `#10B981` | `--color-success` | Paid invoices, completed actions |
| **Success Subtle** | `#ECFDF5` | `--color-success-subtle`| Paid badges |
| **Warning** | `#F59E0B` | `--color-warning` | Pending / Due soon / Partially paid |
| **Warning Subtle** | `#FFFBEB` | `--color-warning-subtle`| Pending badges |
| **Destructive / Overdue** | `#EF4444` | `--color-destructive` | Overdue invoices, delete actions |
| **Destructive Subtle** | `#FEF2F2` | `--color-destructive-subtle`| Overdue badges |

### Typography

- **Headings & Editorial Serif:** `Playfair Display`, serif (Weights: 500, 600, 700) for major marketing headlines, page titles, and select invoice templates (e.g. Elegant).
- **Body & Controls Sans:** `Inter`, sans-serif (Weights: 400, 500, 600) for application UI, forms, tables, buttons, and navigation.
- **Data / Numbers Mono:** `JetBrains Mono` or tabular figures `font-mono` for invoice numbers, currency calculations, and financial line items.

### Spacing & Layout
- 4px grid system: 4px (`xs`), 8px (`sm`), 12px (`md-sm`), 16px (`md`), 24px (`lg`), 32px (`xl`), 48px (`2xl`), 64px (`3xl`).
- Clean borders: `1px solid #E8E8E5`. Avoid heavy double borders or loud shadows.
- Soft shadows: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)`.
- Cards: `rounded-xl`, `border border-[#E8E8E5]`, `bg-white`, `p-6`.

---

## 2. Icon Rules
- Lucide React icons throughout with `strokeWidth={1.75}` for consistent, refined weight.
- Never use emojis as interface icons.
- Tooltips / `aria-label` for all icon-only buttons.
