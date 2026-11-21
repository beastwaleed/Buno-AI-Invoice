# Buno — Premium AI Invoice Generator SaaS

> **"Professional invoices. Made effortless."**

**Buno** is a production-quality, full-stack invoice generation SaaS web application. It combines real authentication, persistent database storage, deterministic floating-point-safe financial calculations, live split-screen previewing, 6 distinct designer invoice templates, quad-format export (PDF, PNG 2.5x, JPEG, Print), and native Google Gemini 1.5 Flash AI capabilities.

Built with **Next.js 14 App Router**, **React 18**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM**.

---

## 🌟 Key Features

### 1. Studio-Quality Invoice Builder & Live Preview
- **Split-Screen Layout**: Real-time side-by-side editing on desktop; responsive Edit/Preview tab switcher on mobile.
- **Dynamic Line Items**: Add, remove, duplicate, and rearrange products and services with keyboard-friendly controls.
- **Deterministic Currency Arithmetic**: Safe decimal rounding for subtotals, line-item discounts, invoice-level percentage/fixed discounts, sales tax, grand totals, and balance due.
- **Real-Time Preview Controls**: Interactive Zoom In, Zoom Out, and Fit to Screen (70% - 130%).

### 2. 11 Distinct Invoice Templates (Including 5 Recreated from User References)
Every template possesses a completely unique layout, table styling, and visual structure:
1. **Modern Studio (`modern`)**: Restrained cool-blue accent, clean hierarchy, badge status, balanced grid.
2. **Pure Minimal (`minimal`)**: Monochrome Swiss aesthetic, hairline dividers, generous whitespace, sharp lines.
3. **Classic Ledger (`classic`)**: Traditional formal business invoice with double rules, boxed table, and signature line.
4. **Editorial Serif (`elegant`)**: Editorial Playfair Display serif headers, warm ivory undertones, sophisticated typography.
5. **Corporate Enterprise (`corporate`)**: Enterprise metadata grid, full-width colored header band, PO reference block.
6. **High-Density Compact (`compact`)**: Condensed row height optimized for 10–30+ line items without excessive page overflow.
7. **Wave Minimal (`wave`)**: Recreated from user reference: organic wave dual-tone footer curve, bold uppercase header, clean sans-serif layout.
8. **Amber Grid (`amber-grid`)**: Recreated from user reference: high-contrast yellow table header, full boxed grid lines, and yellow total block.
9. **Executive Crimson (`crimson`)**: Recreated from user reference: bold red top banner, dark navy body background, sage green header, script signature, and yellow/green bottom stripes.
10. **Royal Blue SaaS (`royal-blue`)**: Recreated from user reference: deep royal blue banner, 5-column breakdown, formal terms, and totals.
11. **Agency Sidebar (`agency-sidebar`)**: Recreated from user reference: dark charcoal left vertical column with rounded arc, burnt orange table header, and total pill badge.

### 3. Custom Template Reference Reproduction Workflow
- Need to recreate a brand's custom invoice, Figma design, screenshot, or scanned PDF?
- Dedicated directory at `public/template-references/uploaded-references/` with full reproduction guide in `public/template-references/README.md`.
- Reusable `TemplateProps` interface enables adding new custom templates with zero modifications to the database or form builder.

### 4. Quad-Format Export System
- **Crisp Vector PDF**: Standard A4 format with multi-page overflow handling and clean file naming (`INV-1001-Client-Name.pdf`).
- **High-Definition PNG Image**: 2.5x pixel ratio for ultra-crisp sharing over Slack, WhatsApp, and messaging.
- **Compact JPEG Image**: Lightweight compressed format with solid background.
- **Native Print Layout**: Specialized `@media print` CSS rules for direct printer output.

### 5. Gemini 1.5 Flash AI Capabilities
- **Prompt-to-Invoice**: Convert natural language descriptions (*"Create an invoice for Apex Labs: 3 landing pages at $1,200 each and logo for $800, 8% tax, due in 15 days"*) into structured JSON validated with Zod.
- **Description Improvement**: Polish shorthand notes into professional B2B client deliverables.
- **AI Payment Reminder Assistant**: Generate tone-customized reminder drafts (**Polite Email**, **WhatsApp Note**, **Friendly Check-in**, **Firm Overdue Notice**).
- **Invoice Financial Insights**: Real-time analytical summary of receivables, collection rate, and top clients.

### 6. Full Business Profile & Customer Directory
- **Company Branding**: Upload and preview business logo (PNG, JPG, WebP), manage tax/VAT IDs, company registration numbers, address, and email.
- **Bank Wire Instructions**: Store electronic funds transfer (EFT) routing, SWIFT, and bank details that auto-populate on invoices.
- **Customer CRM**: Create, edit, search, and manage clients with automatic billing address reuse.
- **Payment Tracking**: Record full or partial payments with transaction IDs, updating invoice status deterministically (`draft`, `sent`, `partially_paid`, `paid`, `overdue`).

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14.2.18 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 with custom design tokens (`design-system/buno/MASTER.md`)
- **Database & ORM**: Prisma ORM 5.22 with SQLite (out-of-the-box local persistence, zero external DB installation needed; easily switchable to PostgreSQL via `DATABASE_URL`)
- **Authentication**: Secure HTTP-only signed cookie sessions with bcrypt password hashing + 1-Click Demo Login
- **Export Engines**: `jspdf` & `html-to-image`
- **AI Integration**: `@google/generative-ai` (Official Google Gemini SDK)
- **Icons & UI**: Lucide React, Sonner (Toast notifications)

---

## 🚀 Quick Start Guide

### 1. Installation
Clone or navigate to the repository and install dependencies:
```bash
npm install
```

### 2. Database Setup & Seeding
Initialize the SQLite database and seed it with demo templates, invoices, and customers:
```bash
npx prisma db push
node prisma/seed.js
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key variables:
- `DATABASE_URL="file:./dev.db"`
- `SESSION_SECRET="your-32-character-secret-key-here"`
- `GEMINI_API_KEY=""` *(Optional: Get your key from [Google AI Studio](https://aistudio.google.com/); Buno includes fallback parsers if key is omitted)*

### 4. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Instant Demo Sign In
On the login screen, click **"One-Click Demo Sign In"** to instantly access the pre-configured Alexander Wright Design Studio account, or use:
- **Email**: `demo@buno.app`
- **Password**: `password123`

---

## 🧪 Testing & Verification

Run the deterministic financial calculations test suite:
```bash
node scripts/test-calculations.js
```

Run the production build:
```bash
npm run build
```

---

## 📂 Project Architecture

```text
├── public/
│   └── template-references/     # Custom template reference workflow & docs
│       ├── README.md
│       └── uploaded-references/
├── prisma/
│   ├── schema.prisma            # Relational schema (User, Profile, Customer, Invoice, etc.)
│   └── seed.js                  # Database seed script
├── src/
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Financial analytics & metrics overview
│   │   ├── invoices/            # Invoice history, search, filtering, payments
│   │   ├── invoices/new/        # Invoice builder with live preview
│   │   ├── invoices/[id]/edit/  # Real-time invoice editor
│   │   ├── customers/           # Client CRM & billing address directory
│   │   ├── templates/           # 6 Template design system showcase
│   │   ├── business/            # Business profile, logo upload, banking info
│   │   ├── settings/            # User settings & Gemini AI config
│   │   ├── auth/                # Login, Register, 1-Click Demo
│   │   └── api/                 # Secure REST API endpoints (Invoices, AI, Customers, Auth)
│   ├── components/
│   │   ├── templates/           # 6 distinct invoice template components
│   │   ├── invoice/             # Invoice builder & list client components
│   │   ├── customer/            # Customer directory client component
│   │   ├── business/            # Business profile client component
│   │   ├── layout/              # Collapsible sidebar & responsive AppShell
│   │   └── ExportMenu.tsx       # PDF, PNG, JPEG, Print dropdown menu
│   ├── lib/
│   │   ├── calculations.ts      # Floating-point safe financial calculations
│   │   ├── gemini.ts            # Gemini AI SDK integration
│   │   ├── export.ts            # High-res PDF, PNG, JPEG & Print logic
│   │   ├── auth.ts              # Session cookies & password hashing
│   │   └── prisma.ts            # Singleton Prisma client
│   └── types/
│       └── invoice.ts           # Unified data models & TypeScript definitions
```

---

## 📄 License
MIT &copy; 2026 Buno Invoicing Systems. All rights reserved.
