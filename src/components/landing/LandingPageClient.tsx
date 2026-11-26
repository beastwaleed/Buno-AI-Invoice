"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Globe,
  Layers,
  Mic,
  Maximize2,
  Minimize2,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  Zap,
  ChevronRight,
  Cpu,
  Coins,
  Crop,
  Database,
  Printer,
  ExternalLink,
  Code2,
} from "lucide-react";
import { TEMPLATE_LIST, InvoiceRenderer } from "@/components/templates";
import { InvoiceData, TemplateDefinition } from "@/types/invoice";
import { BunoLogo } from "@/components/ui/BunoLogo";

// Currencies supported in interactive hero
type SupportedCurrency = "USD" | "PKR" | "EUR" | "INR" | "AED";

interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  subtotal: number;
  tax: number;
  total: number;
  item1Price: number;
  item2Price: number;
}

const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: "USD",
    symbol: "$",
    subtotal: 7000,
    tax: 350,
    total: 7350,
    item1Price: 3800,
    item2Price: 100,
  },
  PKR: {
    code: "PKR",
    symbol: "Rs",
    subtotal: 1950000,
    tax: 97500,
    total: 2047500,
    item1Price: 1050000,
    item2Price: 28125,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    subtotal: 6500,
    tax: 325,
    total: 6825,
    item1Price: 3500,
    item2Price: 93.75,
  },
  INR: {
    code: "INR",
    symbol: "₹",
    subtotal: 580000,
    tax: 29000,
    total: 609000,
    item1Price: 320000,
    item2Price: 8125,
  },
  AED: {
    code: "AED",
    symbol: "AED",
    subtotal: 25700,
    tax: 1285,
    total: 26985,
    item1Price: 14000,
    item2Price: 365,
  },
};

// Base sample invoice for real live template rendering
const createSampleInvoice = (
  currencyKey: SupportedCurrency,
  templateSlug: string
): InvoiceData => {
  const c = CURRENCIES[currencyKey] || CURRENCIES.USD;
  return {
    invoiceNumber: "INV-2026-081",
    templateId: templateSlug,
    status: "sent",
    invoiceDate: "2026-11-20",
    dueDate: "2026-12-05",
    currency: c.code,
    subtotal: c.subtotal,
    discount: 0,
    discountType: "percentage",
    taxRate: 5,
    taxTotal: c.tax,
    total: c.total,
    amountPaid: 0,
    balanceDue: c.total,
    notes: "Payment due within 15 calendar days. Thank you for your partnership.",
    paymentTerms: "Net 15 Days",
    business: {
      businessName: "Vortex Design Studio",
      ownerName: "Alexander Wright",
      email: "billing@vortexstudio.co",
      phone: "+1 (415) 890-1122",
      address: "580 Howard Street, Suite 400\nSan Francisco, CA 94105",
      taxNumber: "US-84-9382104",
      bankDetails: "Silicon Valley Bank\nAcct: 4892-0193-8401 · Routing: 121000358",
    },
    customer: {
      name: "Elena Rostova",
      companyName: "Acme Cloud Technologies",
      email: "elena@acmecloud.io",
      address: "100 Montgomery St, 18th Floor\nSan Francisco, CA 94104",
      taxNumber: "US-94-118290",
    },
    items: [
      {
        description: "Brand Architecture & Typographic Design System",
        quantity: 1,
        unit: "deliverable",
        unitPrice: c.item1Price,
        discount: 0,
        taxRate: 5,
        lineTotal: c.item1Price,
      },
      {
        description: "Fullstack Cloud Implementation & QA Review",
        quantity: 32,
        unit: "hrs",
        unitPrice: c.item2Price,
        discount: 0,
        taxRate: 5,
        lineTotal: c.subtotal - c.item1Price,
      },
    ],
  };
};

// Multilingual Voice Prompts Showcase Data
const VOICE_PROMPTS = [
  {
    id: "roman-urdu",
    label: "Roman Urdu",
    flag: "🇵🇰",
    transcript: "Ali Khan k liye 50 hazar rupay web development k invoice bana do, 5 percent tax laga kar, due in 10 days.",
    output: {
      client: "Ali Khan",
      currency: "PKR (Rs)",
      deliverables: "1x Web Development",
      amount: "Rs 50,000",
      tax: "5% (Rs 2,500)",
      total: "Rs 52,500",
      dueDate: "+10 Days",
    },
  },
  {
    id: "english",
    label: "English (Natural)",
    flag: "🇺🇸",
    transcript: "Generate an invoice for Acme Corp. 40 hours of frontend development at $85 per hour and $500 cloud infrastructure setup.",
    output: {
      client: "Acme Corp",
      currency: "USD ($)",
      deliverables: "40 hrs Frontend ($3,400) + 1x Cloud Setup ($500)",
      amount: "$3,900",
      tax: "0% (Tax Exempt)",
      total: "$3,900",
      dueDate: "Net 30 Days",
    },
  },
  {
    id: "hindi",
    label: "Hindi (Hinglish)",
    flag: "🇮🇳",
    transcript: "Sharma Enterprises ke liye 1 lakh 20 hazar rupaye ka mobile app design invoice create karo, 18% GST add kardo.",
    output: {
      client: "Sharma Enterprises",
      currency: "INR (₹)",
      deliverables: "1x Mobile App UI/UX Design",
      amount: "₹1,20,000",
      tax: "18% GST (₹21,600)",
      total: "₹1,41,600",
      dueDate: "Net 15 Days",
    },
  },
  {
    id: "arabic",
    label: "Arabic (العربية)",
    flag: "🇦🇪",
    transcript: "أنشئ فاتورة لشركة النور للحلول السحابية بقيمة 15000 درهم إماراتي لتصميم الهوية التجارية مع ضريبة 5 بالمئة",
    output: {
      client: "شركة النور للحلول السحابية",
      currency: "AED (درهم)",
      deliverables: "1x Brand Identity Design",
      amount: "AED 15,000",
      tax: "5% VAT (AED 750)",
      total: "AED 15,750",
      dueDate: "Net 15 Days",
    },
  },
];

export const LandingPageClient: React.FC = () => {
  // Hero interactive states
  const [heroCurrency, setHeroCurrency] = useState<SupportedCurrency>("USD");
  const [heroTemplate, setHeroTemplate] = useState<string>("classic");

  // Template gallery states
  const [templateCategory, setTemplateCategory] = useState<string>("all");
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Voice AI prompt state
  const [activeVoicePrompt, setActiveVoicePrompt] = useState<string>("roman-urdu");

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPreviewTemplate(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter templates
  const filteredTemplates = TEMPLATE_LIST.filter((tpl) => {
    if (templateCategory === "all") return true;
    if (templateCategory === "minimal") {
      return ["minimal", "wave", "compact"].includes(tpl.slug);
    }
    if (templateCategory === "creative") {
      return ["agency-sidebar", "amber-grid", "crimson"].includes(tpl.slug);
    }
    if (templateCategory === "corporate") {
      return ["corporate", "classic", "royal-blue"].includes(tpl.slug);
    }
    return true;
  });

  const heroInvoiceData = createSampleInvoice(heroCurrency, heroTemplate);
  const activePromptData =
    VOICE_PROMPTS.find((p) => p.id === activeVoicePrompt) || VOICE_PROMPTS[0];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#0F172A] selection:bg-neutral-900 selection:text-white flex flex-col justify-between font-sans antialiased">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/85 backdrop-blur-md border-b border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 focus:outline-none group">
              <BunoLogo size="sm" />
              <span className="hidden sm:inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[#475569] border border-[#E2E8F0]">
                v2.4 Production
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#64748B]">
            <a href="#templates" className="hover:text-[#0F172A] transition-colors">
              Templates (9)
            </a>
            <a href="#architecture" className="hover:text-[#0F172A] transition-colors">
              Architecture
            </a>
            <a href="#voice-ai" className="hover:text-[#0F172A] transition-colors">
              Voice Intelligence
            </a>
            <a
              href="https://github.com/beastwaleed/Buno-AI-Invoice"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[#0F172A] transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-3.5 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F172A] hover:bg-black rounded-lg shadow-2xs transition-all active:scale-[0.98]"
            >
              <span>Create Invoice</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Subtle Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#E2E8F0] shadow-2xs text-xs font-mono text-[#334155]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production Ready · 9 Typographic Systems · Open Source</span>
        </div>

        {/* Main Value Headline */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#0F172A] leading-[1.08]">
            Invoicing engineered for <br className="hidden sm:inline" />
            <span className="text-[#334155]">precision & speed.</span>
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Deterministic multi-currency calculations, multilingual voice input, and 9 production typographic templates. Free, open source, and built with zero subscription paywalls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/invoices/new"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Create Invoice — Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#templates"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#64748B]" />
            <span>Explore 9 Templates</span>
          </a>
        </div>

        {/* Reassurance Metadata Strip */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Instant vector PDF & PNG export
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Multi-currency (PKR, INR, USD, EUR, AED)
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" /> Zero watermarks
          </span>
        </div>

        {/* 3. Hero Product Live Studio Workbench (Interactive Tool Preview) */}
        <div className="pt-8 max-w-6xl mx-auto text-left">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Window Titlebar */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80" />
                <div className="w-3 h-3 rounded-full bg-[#10B981]/80" />
                <span className="ml-2 text-xs font-mono text-[#64748B]">
                  buno-studio // INV-2026-081 · Elena Rostova
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                  Status: Ready
                </span>
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#64748B] bg-[#F1F3F5] px-2 py-0.5 rounded">
                  A4 Vector 300 DPI
                </span>
              </div>
            </div>

            {/* Split Studio Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
              {/* Left Configuration Pane */}
              <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-[#E2E8F0] flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-5">
                  {/* Currency Switcher */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[#475569] flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#0F172A]" />
                        <span>Interactive Currency Switcher</span>
                      </label>
                      <span className="text-[10px] font-mono text-[#64748B]">Click to test</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                      {(["USD", "PKR", "EUR", "INR", "AED"] as SupportedCurrency[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setHeroCurrency(c)}
                          className={`py-1 text-xs font-mono font-semibold rounded transition-all ${
                            heroCurrency === c
                              ? "bg-[#0F172A] text-white shadow-2xs"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template Switcher */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#475569] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>Active Typographic System</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { slug: "classic", label: "Classic Ledger" },
                        { slug: "minimal", label: "Pure Minimal" },
                        { slug: "corporate", label: "Corporate" },
                        { slug: "wave", label: "Wave Minimal" },
                        { slug: "royal-blue", label: "Royal Blue" },
                      ].map((t) => (
                        <button
                          key={t.slug}
                          onClick={() => setHeroTemplate(t.slug)}
                          className={`px-2.5 py-1 text-xs rounded-md border transition-all ${
                            heroTemplate === t.slug
                              ? "bg-[#0F172A] text-white border-[#0F172A] font-medium"
                              : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Multilingual Voice Assistant Demo Widget */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-blue-600" />
                        <span>Voice AI Parser Active</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Urdu · Hindi · Eng · Arab
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed italic bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                      &quot;Ali Khan k liye 50 hazar web development k invoice bana do, 5% tax...&quot;
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
                      <span>Mapped: 1x Deliverable</span>
                      <span className="font-mono font-medium text-[#0F172A]">Tax: 5% Auto-computed</span>
                    </div>
                  </div>

                  {/* Calculated Math Preview */}
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Subtotal:</span>
                      <span className="font-mono font-medium text-[#0F172A]">
                        {CURRENCIES[heroCurrency].symbol}{" "}
                        {CURRENCIES[heroCurrency].subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748B]">
                      <span>Deterministic Tax (5%):</span>
                      <span className="font-mono font-medium text-[#0F172A]">
                        {CURRENCIES[heroCurrency].symbol}{" "}
                        {CURRENCIES[heroCurrency].tax.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-[#E2E8F0] font-semibold text-sm text-[#0F172A]">
                      <span>Balance Due:</span>
                      <span className="font-mono text-blue-600">
                        {CURRENCIES[heroCurrency].symbol}{" "}
                        {CURRENCIES[heroCurrency].total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/invoices/new?template=${heroTemplate}`}
                    className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>Launch Editor With This Setup</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Live Rendered Invoice Viewport */}
              <div className="lg:col-span-7 bg-[#F1F3F5] p-4 sm:p-6 flex items-center justify-center overflow-hidden relative">
                <div className="w-full max-w-[560px] bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                  <div className="relative h-[480px] overflow-hidden bg-white">
                    {/* Live Scaled Miniature Viewport */}
                    <div className="absolute top-0 left-0 w-[720px] pointer-events-none select-none origin-top-left transform scale-[0.62] sm:scale-[0.70] p-4">
                      <InvoiceRenderer
                        invoice={heroInvoiceData}
                        templateId={heroTemplate}
                      />
                    </div>
                    {/* Subtle bottom fade */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
                    <span className="font-mono text-[11px]">
                      Active: {heroTemplate.toUpperCase()} · Currency: {heroCurrency}
                    </span>
                    <button
                      onClick={() => setSelectedPreviewTemplate(heroTemplate)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full View</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Complete 9 Typographic Templates Showcase Section */}
      <section id="templates" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E8E5] pb-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono font-semibold text-[#475569] uppercase tracking-wider">
              Typographic Systems
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              9 Bespoke Invoice Templates.
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Every template is built with deterministic CSS grids, distinct typographic hierarchies, and print-ready stylesheets. Zero cookie-cutter designs.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F1F3F5] rounded-xl border border-[#E2E8F0]">
            {[
              { id: "all", label: `All (${TEMPLATE_LIST.length})` },
              { id: "minimal", label: "Minimalist & Swiss" },
              { id: "creative", label: "Studio & Creative" },
              { id: "corporate", label: "Corporate & Ledger" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTemplateCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  templateCategory === tab.id
                    ? "bg-white text-[#0F172A] shadow-2xs font-semibold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 11 Templates Grid with Live Scaled Miniatures */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.slug}
              className="bg-white rounded-2xl border border-[#E8E8E5] overflow-hidden shadow-2xs hover:shadow-md hover:border-[#CBD5E1] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Scaled Miniature Viewport */}
                <div className="relative h-64 bg-[#F8FAFC] border-b border-[#E8E8E5] overflow-hidden">
                  <div className="absolute top-0 left-0 w-[720px] pointer-events-none select-none origin-top-left transform scale-[0.38] md:scale-[0.41] shadow-2xs border border-[#E8E8E5]">
                    <InvoiceRenderer
                      invoice={createSampleInvoice("USD", tpl.slug)}
                      templateId={tpl.slug}
                      accentColor={tpl.accentColor}
                    />
                  </div>

                  {/* Gradient Fade Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/90 to-transparent pointer-events-none" />

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5">
                    <button
                      onClick={() => setSelectedPreviewTemplate(tpl.slug)}
                      className="px-3 py-2 bg-white text-[#0F172A] rounded-lg text-xs font-semibold shadow-md hover:bg-[#F8FAFC] flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0F172A]" />
                      <span>Full Preview</span>
                    </button>
                    <Link
                      href={`/invoices/new?template=${tpl.slug}`}
                      className="px-3 py-2 bg-[#0F172A] text-white rounded-lg text-xs font-semibold shadow-md hover:bg-black flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <span>Use Template</span>
                    </Link>
                  </div>
                </div>

                {/* Template Info Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base text-[#0F172A]">
                      {tpl.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10"
                        style={{ backgroundColor: tpl.accentColor || "#0F172A" }}
                        title="Primary template accent"
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] px-2 py-0.5 rounded bg-[#F1F3F5] border border-[#E2E8F0]">
                        {tpl.fontStyle}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTemplate(tpl.slug)}
                  className="px-3 py-2 text-xs font-medium text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F3F5] rounded-lg border border-[#E2E8F0] transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <Link
                  href={`/invoices/new?template=${tpl.slug}`}
                  className="flex-1 text-center py-2 px-3 text-xs font-medium rounded-lg text-white bg-[#0F172A] hover:bg-black transition-colors"
                >
                  Use Layout
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Production Architecture & Engineering Section (Substance over AI Slop) */}
      <section id="architecture" className="py-24 bg-white border-y border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-mono font-semibold text-[#475569] uppercase tracking-wider">
              Engineering & Reliability
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              Built for production integrity.
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Invoicing is legal financial communication. Buno is architected for deterministic mathematical precision, regional currency compliance, and instant client export.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Deterministic Financial Math
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Zero floating-point rounding errors or AI guesses. Subtotals, tiered sales taxes, percentage discounts, and balance due execute with strict 2-decimal rounded precision arithmetic.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Mic className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Multilingual Voice AI Assistant
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Speak naturally in Roman Urdu, Hindi, Arabic, or English. Gemini 1.5 extracts client names, quantities, unit prices, and regional terms like &quot;lakh&quot; or &quot;hazar&quot; into structured JSON.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Universal Multi-Currency System
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full native currency handling for PKR (Rs), INR (₹), USD ($), EUR (€), AED, GBP (£), and SAR. Business profile currency settings automatically sync across your financial analytics dashboard.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Crop className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Aspect-Locked Logo Cropper
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Upload your company logo and crop with interactive locked aspect ratios (1:1 Square, 4:3 Document, 16:9 Banner) to ensure your brand mark never stretches or distorts on client invoices.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Vector PDF & Quad-Format Export
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Export vector A4 PDFs via headless Chromium, 2.5x high-definition PNGs for mobile WhatsApp sharing, compact JPEG, or native browser print stylesheets with zero layout clipping.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-[#FAFAF8] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] shadow-2xs">
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-[#0F172A]">
                Relational Database Persistence
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                PostgreSQL and Prisma ORM back every record. Invoices, customer directory, business profiles, and payment histories are permanently indexed and safely stored with account password recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Interactive Voice AI Demonstration (Transparent, Real Capabilities) */}
      <section id="voice-ai" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono font-semibold text-[#475569] uppercase tracking-wider">
            Conversational Intelligence
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Speak in any language. Buno itemizes it.
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            No complex form filling. Tap the microphone and describe your work naturally in Urdu, Hindi, Arabic, or English. Gemini 1.5 extracts clients, line items, and taxes with Zod schema validation.
          </p>
        </div>

        {/* Interactive Voice Playground Card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          {/* Tab Selector */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#64748B] mr-2">Try Real Voice Prompts:</span>
              {VOICE_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveVoicePrompt(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    activeVoicePrompt === p.id
                      ? "bg-white text-[#0F172A] shadow-2xs font-semibold border border-[#E2E8F0]"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <span>{p.flag}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Web Speech API + Gemini 1.5
            </span>
          </div>

          {/* Split Prompt & Structured Output View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
            {/* Left: Input Speech Transcription */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Speech Input Transcription</span>
                </span>
                <span className="font-mono text-[11px]">Audio Recognized</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-[#0F172A] leading-relaxed font-mono">
                &quot;{activePromptData.transcript}&quot;
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Zero complex manual data entry required.</span>
              </div>
            </div>

            {/* Right: Deterministic Structured JSON Extraction */}
            <div className="p-6 space-y-4 bg-[#FAFAF8]">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Deterministic Extraction Result</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-600 font-bold">
                  Zod Validated
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">clientName:</span>
                  <span className="font-bold text-[#0F172A]">
                    &quot;{activePromptData.output.client}&quot;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">currency:</span>
                  <span className="text-blue-600 font-bold">
                    &quot;{activePromptData.output.currency}&quot;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">deliverables:</span>
                  <span className="text-[#0F172A]">
                    &quot;{activePromptData.output.deliverables}&quot;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">subtotal:</span>
                  <span className="font-bold text-[#0F172A]">
                    {activePromptData.output.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">taxRate:</span>
                  <span className="text-[#0F172A]">{activePromptData.output.tax}</span>
                </div>
                <div className="flex justify-between border-t border-[#E2E8F0] pt-2 font-bold text-sm">
                  <span className="text-[#0F172A]">totalPayable:</span>
                  <span className="text-blue-600">{activePromptData.output.total}</span>
                </div>
              </div>

              <Link
                href="/invoices/new"
                className="w-full py-2.5 px-4 bg-[#0F172A] hover:bg-black text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Try Voice AI in Live Editor</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Zero Paywall Proposition (No fake pricing cards) */}
      <section className="py-20 bg-white border-t border-[#E8E8E5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-mono font-semibold text-[#475569] uppercase tracking-wider">
              Transparency
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0F172A]">
              100% Free & Open Source. <br />
              <span className="text-[#64748B]">Zero subscription paywalls.</span>
            </h2>
            <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Essential business tools should be fast, private, and accessible to every founder without \$30/month fees or watermarks.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
              <span className="text-xl font-bold text-[#0F172A]">9</span>
              <p className="text-xs text-[#64748B] mt-1">Typographic templates unlocked</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
              <span className="text-xl font-bold text-[#0F172A]">Unlimited</span>
              <p className="text-xs text-[#64748B] mt-1">Invoices & customer directory</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
              <span className="text-xl font-bold text-[#0F172A]">0%</span>
              <p className="text-xs text-[#64748B] mt-1">Transaction or export fees</p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E2E8F0]">
              <span className="text-xl font-bold text-[#0F172A]">100%</span>
              <p className="text-xs text-[#64748B] mt-1">MIT open source code</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/invoices/new"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Start Invoicing Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/beastwaleed/Buno-AI-Invoice"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2"
            >
              <Code2 className="w-4 h-4 text-[#64748B]" />
              <span>View Source on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Minimalist Production Footer */}
      <footer className="border-t border-[#E8E8E5] bg-[#FAFAF8] py-14 px-4 sm:px-6 lg:px-8 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BunoLogo size="sm" showText={true} />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Precision invoicing SaaS built for modern independent founders, studios, and agencies.
            </p>
            <p className="font-mono text-[11px] text-[#94A3B8]">
              Released under the MIT License.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-[#0F172A] text-xs uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link href="/invoices/new" className="hover:text-[#0F172A] transition-colors">
                  Create Invoice
                </Link>
              </li>
              <li>
                <a href="#templates" className="hover:text-[#0F172A] transition-colors">
                  9 Design Templates
                </a>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#0F172A] transition-colors">
                  Financial Analytics
                </Link>
              </li>
              <li>
                <Link href="/business" className="hover:text-[#0F172A] transition-colors">
                  Business Branding & Logo Cropper
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-[#0F172A] text-xs uppercase tracking-wider">
              Architecture & Stack
            </h4>
            <ul className="space-y-1.5">
              <li>Next.js 14 (App Router)</li>
              <li>TypeScript & Tailwind CSS</li>
              <li>Google Gemini 1.5 + Web Speech</li>
              <li>PostgreSQL & Prisma ORM</li>
              <li>Headless Chromium Vector PDF</li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-semibold text-[#0F172A] text-xs uppercase tracking-wider">
              Deployment
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://github.com/beastwaleed/Buno-AI-Invoice"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-[#0F172A] transition-colors"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Production: Vercel Edge</li>
              <li className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>All systems operational</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#E8E8E5] flex flex-col sm:flex-row items-center justify-between gap-4 text-[#94A3B8]">
          <p>© {new Date().getFullYear()} Buno AI Invoice Studio. Built by Waleed Afzal.</p>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hover:text-[#0F172A] transition-colors">
              Sign In
            </Link>
            <span>&bull;</span>
            <Link href="/auth/register" className="hover:text-[#0F172A] transition-colors">
              Register
            </Link>
            <span>&bull;</span>
            <a href="#templates" className="hover:text-[#0F172A] transition-colors">
              Templates
            </a>
          </div>
        </div>
      </footer>

      {/* 9. Full Screen High-Res Live Template Preview Modal */}
      {selectedPreviewTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0] animate-in fade-in-50 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E8E8E5] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-[#0F172A]">
                  {TEMPLATE_LIST.find((t) => t.slug === selectedPreviewTemplate)?.name ||
                    selectedPreviewTemplate}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[#64748B]">
                  {TEMPLATE_LIST.find((t) => t.slug === selectedPreviewTemplate)?.fontStyle}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="hidden sm:flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setPreviewZoom(Math.max(60, previewZoom - 15))}
                    className="px-2 py-0.5 hover:bg-[#F1F3F5] rounded text-[#64748B]"
                  >
                    -
                  </button>
                  <span className="px-1 text-[11px] font-mono">{previewZoom}%</span>
                  <button
                    onClick={() => setPreviewZoom(Math.min(130, previewZoom + 15))}
                    className="px-2 py-0.5 hover:bg-[#F1F3F5] rounded text-[#64748B]"
                  >
                    +
                  </button>
                </div>

                <Link
                  href={`/invoices/new?template=${selectedPreviewTemplate}`}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F172A] text-white hover:bg-black transition-colors"
                >
                  Use Layout
                </Link>

                <button
                  onClick={() => setSelectedPreviewTemplate(null)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F3F5] transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: High Fidelity Scaled Invoice */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F1F3F5] flex justify-center">
              <div
                className="bg-white rounded-xl shadow-lg border border-[#E2E8F0] overflow-hidden transition-transform duration-150 origin-top"
                style={{
                  width: "720px",
                  transform: `scale(${previewZoom / 100})`,
                }}
              >
                <InvoiceRenderer
                  invoice={createSampleInvoice("USD", selectedPreviewTemplate)}
                  templateId={selectedPreviewTemplate}
                  accentColor={
                    TEMPLATE_LIST.find((t) => t.slug === selectedPreviewTemplate)?.accentColor
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
