import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Download,
  Palette,
  ShieldCheck,
  Zap,
  FileText,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { TEMPLATE_LIST } from "@/components/templates";
import { BunoLogo } from "@/components/ui/BunoLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#202124] selection:bg-blue-100 flex flex-col justify-between">
      {/* 1. Navigation Bar */}
      <header className="h-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center focus:outline-none">
          <BunoLogo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#70757A]">
          <a href="#templates" className="hover:text-[#202124] transition-colors">
            Templates
          </a>
          <a href="#features" className="hover:text-[#202124] transition-colors">
            Features
          </a>
          <a href="#ai" className="hover:text-[#202124] transition-colors">
            AI Assistant
          </a>
          <a href="#pricing" className="hover:text-[#202124] transition-colors">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-xs font-medium text-[#70757A] hover:text-[#202124] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-xl shadow-xs transition-all"
          >
            <span>Create Invoice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-12 pb-20 px-6 sm:px-8 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] border border-blue-200/60 text-[#4468E8] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Studio Invoicing SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-[#202124] leading-[1.1]">
          Professional invoices. <br />
          <span className="italic font-normal">Made effortless.</span>
        </h1>

        <p className="text-base sm:text-lg text-[#70757A] max-w-2xl mx-auto leading-relaxed">
          Create, customize, and issue editorial-grade invoices in minutes. Choose from 11 bespoke templates, export crisp vector PDFs, and automate line items with Buno AI.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href="/invoices/new"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-xl shadow-card transition-all flex items-center justify-center gap-2"
          >
            <span>Create an Invoice Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-[#202124] bg-white border border-[#E8E8E5] hover:bg-[#F5F5F3] rounded-xl shadow-subtle transition-all"
          >
            Instant Demo Access
          </Link>
        </div>

        {/* Hero Product Live Preview Card */}
        <div className="pt-12">
          <div className="p-3 sm:p-5 rounded-3xl bg-white border border-[#E8E8E5] shadow-invoice max-w-4xl mx-auto">
            <div className="bg-[#FAFAF8] rounded-2xl border border-[#E8E8E5] p-6 sm:p-10 text-left space-y-6">
              <div className="flex justify-between items-start border-b border-[#E8E8E5] pb-6">
                <div>
                  <div className="h-8 w-24 bg-[#4468E8] rounded-lg flex items-center justify-center text-white font-bold text-xs">
                    STUDIO
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#202124] mt-2">
                    Wright & Associates Design
                  </h3>
                  <p className="text-xs text-[#70757A]">San Francisco, CA &bull; TAX: US-84-9382104</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-[#4468E8]">
                    INV-1002
                  </span>
                  <div className="text-xs text-[#70757A] mt-1">Due: in 14 days</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#70757A] uppercase tracking-wider block">Billed To</span>
                  <p className="font-bold text-[#202124]">Acme Cloud Technologies</p>
                  <p className="text-[#70757A]">100 Montgomery St, San Francisco</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#70757A] uppercase tracking-wider block">Total Payable</span>
                  <p className="font-serif font-bold text-xl text-[#202124]">$13,020.00</p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                    Net 15 Days
                  </span>
                </div>
              </div>

              <div className="border-t border-[#E8E8E5] pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#70757A]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Real-time Preview
                  </span>
                  <span className="flex items-center gap-1.5 text-[#4468E8]">
                    <Download className="w-4 h-4" /> Multi-format Export
                  </span>
                </div>
                <span className="font-mono text-[11px]">Rendered with Modern Studio Template</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Template Showcase Section */}
      <section id="templates" className="py-20 px-6 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#4468E8] uppercase tracking-widest">
            Design Systems
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#202124]">
            6 Distinct Designer Templates
          </h2>
          <p className="text-xs sm:text-sm text-[#70757A]">
            Built with pure CSS and deterministic layouts. Never cookie-cutter templates with identical tables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATE_LIST.map((tpl) => (
            <div
              key={tpl.slug}
              className="bg-white rounded-2xl border border-[#E8E8E5] p-6 shadow-subtle hover:border-blue-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-base text-[#202124]">
                    {tpl.name}
                  </h3>
                  <span className="text-[10px] font-mono text-[#70757A] px-2 py-0.5 rounded bg-[#FAFAF8] border border-[#E8E8E5]">
                    {tpl.fontStyle}
                  </span>
                </div>
                <p className="text-xs text-[#70757A] leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <Link
                href={`/invoices/new?template=${tpl.slug}`}
                className="inline-flex items-center justify-between text-xs font-semibold text-[#4468E8] hover:underline pt-2 border-t border-[#F0F0EE]"
              >
                <span>Use this layout</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AI Feature Section */}
      <section id="ai" className="py-20 bg-white border-y border-[#E8E8E5]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4468E8] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Buno Intelligent AI Engine</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#202124] leading-tight">
              Type naturally. <br />
              <span className="italic font-normal">AI builds the invoice.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#70757A] leading-relaxed">
              Describe your project deliverables in conversational English. Buno AI extracts client details, line quantities, rates, taxes, and payment terms into structured JSON with Zod validation.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-[#202124]">Prompt-to-Invoice</span>
                  <p className="text-[#70757A]">Instant conversion from chat prompts to complete editable forms.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-[#202124]">Description Improvement</span>
                  <p className="text-[#70757A]">Turn shorthand work notes into polished client-ready deliverables.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-[#202124]">AI Payment Reminders</span>
                  <p className="text-[#70757A]">Draft polite emails, WhatsApp notes, or firm notices in one click.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FAFAF8] p-6 rounded-3xl border border-[#E8E8E5] shadow-card space-y-4">
            <div className="bg-white p-4 rounded-xl border border-[#E8E8E5] space-y-2">
              <span className="text-[10px] text-[#70757A] font-semibold uppercase tracking-wider">
                User Prompt:
              </span>
              <p className="text-xs font-mono text-[#202124] italic">
                &quot;Create invoice for Ahmed Traders. Three website pages at Rs 15,000 each and logo design at Rs 8,000. 5% tax. Due in 10 days.&quot;
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#4468E8] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Structured Output
                </span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Validated</span>
              </div>
              <div className="space-y-1.5 text-xs text-[#202124]">
                <div className="flex justify-between">
                  <span>Client:</span>
                  <span className="font-medium">Ahmed Traders</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-mono">3x Web Pages (Rs 45,000) + 1x Logo (Rs 8,000)</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-mono">5% (Rs 2,650)</span>
                </div>
                <div className="flex justify-between border-t border-[#F0F0EE] pt-1.5 font-bold">
                  <span>Total Calculated:</span>
                  <span className="font-mono text-[#4468E8]">Rs 55,650</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid Section */}
      <section id="features" className="py-20 px-6 sm:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#4468E8] uppercase tracking-widest">
            Core Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#202124]">
            Engineered for Precision & Trust
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4468E8] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#202124]">
              Deterministic Calculations
            </h3>
            <p className="text-xs text-[#70757A] leading-relaxed">
              All financial calculations (subtotals, percentage & fixed discounts, multi-rate tax, payments, and balance due) use deterministic 2-decimal rounded code—never AI guesses.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#202124]">
              Quad-Format Export
            </h3>
            <p className="text-xs text-[#70757A] leading-relaxed">
              Export in standard A4 PDF for sharing, 2.5x high-definition PNG for messaging, compact JPEG, or native browser print formatting with zero clipping.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#202124]">
              Relational Database Persistence
            </h3>
            <p className="text-xs text-[#70757A] leading-relaxed">
              Enterprise cloud persistence. Your customers, business profile, logo, payments, and invoice versions are saved permanently.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Pricing Section */}
      <section id="pricing" className="py-20 bg-white border-t border-[#E8E8E5]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center space-y-6">
          <span className="text-xs font-bold text-[#4468E8] uppercase tracking-widest">
            Simple Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#202124]">
            Transparent Value for Modern Studios
          </h2>
          <p className="text-xs sm:text-sm text-[#70757A] max-w-lg mx-auto">
            Everything you need to invoice clients with utmost professionalism.
          </p>

          <div className="pt-6 max-w-md mx-auto">
            <div className="p-8 rounded-3xl bg-[#FAFAF8] border-2 border-[#4468E8] shadow-elevated space-y-6 text-left">
              <div className="flex justify-between items-baseline">
                <div>
                  <h3 className="font-serif font-bold text-xl text-[#202124]">Studio Pro</h3>
                  <p className="text-xs text-[#70757A]">For freelancers, agencies & businesses</p>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-3xl text-[#202124]">$0</span>
                  <span className="text-xs text-[#70757A]"> / month</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-[#202124]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4468E8]" />
                  <span>Unlimited invoices & customer directory</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4468E8]" />
                  <span>All 6 bespoke invoice templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4468E8]" />
                  <span>PDF, PNG, JPEG, and Print exports</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4468E8]" />
                  <span>Buno AI prompt-to-invoice extraction</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4468E8]" />
                  <span>Custom reference template engine</span>
                </div>
              </div>

              <Link
                href="/invoices/new"
                className="w-full py-3 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-[#E8E8E5] bg-white py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#70757A]">
          <div className="flex items-center gap-2">
            <BunoLogo size="sm" showText={false} />
            <span className="font-serif font-bold text-sm text-[#202124]">Buno</span>
            <span>&bull; Premium AI Invoice Generator SaaS</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#202124]">
              Dashboard
            </Link>
            <Link href="/templates" className="hover:text-[#202124]">
              Templates
            </Link>
            <Link href="/auth/login" className="hover:text-[#202124]">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
