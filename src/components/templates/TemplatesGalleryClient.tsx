"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Eye, Plus, ArrowRight, X, Sparkles } from "lucide-react";
import { TEMPLATE_LIST, InvoiceRenderer } from "@/components/templates";
import { InvoiceData } from "@/types/invoice";

interface TemplatesGalleryClientProps {
  currentDefault: string;
  businessProfile?: any;
}

// High-fidelity sample invoice used to render real template previews
const sampleInvoice: InvoiceData = {
  invoiceNumber: "INV-2026-081",
  templateId: "classic",
  status: "sent",
  invoiceDate: "2026-11-20",
  dueDate: "2026-12-05",
  currency: "USD",
  subtotal: 5400,
  discount: 0,
  discountType: "percentage",
  taxRate: 8.5,
  taxTotal: 459,
  total: 5859,
  amountPaid: 0,
  balanceDue: 5859,
  notes: "Thank you for your business! Payment is due within 15 days.",
  paymentTerms: "Net 15 Days",
  business: {
    businessName: "Wright & Associates",
    ownerName: "Alexander Wright",
    email: "billing@wrightdesign.co",
    phone: "+1 (415) 890-1122",
    address: "580 Howard Street, Suite 400\nSan Francisco, CA 94105",
    taxNumber: "US-84-9382104",
    bankDetails: "Silicon Valley Bank\nAcct: 4892-0193-8401\nRouting: 121000358",
  },
  customer: {
    name: "Elena Rostova",
    companyName: "Acme Cloud Technologies",
    email: "elena@acmecloud.io",
    address: "100 Montgomery St, 18th Floor\nSan Francisco, CA",
    taxNumber: "US-94-118290",
  },
  items: [
    {
      description: "Brand Strategy & Design System",
      quantity: 1,
      unit: "deliverable",
      unitPrice: 3800,
      discount: 0,
      taxRate: 8.5,
      lineTotal: 3800,
    },
    {
      description: "Interactive Prototype & QA Review",
      quantity: 16,
      unit: "hrs",
      unitPrice: 100,
      discount: 0,
      taxRate: 8.5,
      lineTotal: 1600,
    },
  ],
};

export const TemplatesGalleryClient: React.FC<TemplatesGalleryClientProps> = ({
  currentDefault,
  businessProfile,
}) => {
  const [selectedPreviewTemplate, setSelectedPreviewTemplate] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const activeInvoice: InvoiceData = {
    ...sampleInvoice,
    business: {
      ...sampleInvoice.business,
      businessName: businessProfile?.businessName || sampleInvoice.business.businessName,
      ownerName: businessProfile?.ownerName || sampleInvoice.business.ownerName,
      logoUrl: businessProfile?.logoUrl || "",
      address: businessProfile?.address || sampleInvoice.business.address,
      phone: businessProfile?.phone || sampleInvoice.business.phone,
      email: businessProfile?.email || sampleInvoice.business.email,
      website: businessProfile?.website || sampleInvoice.business.website,
      bankDetails: businessProfile?.bankDetails || sampleInvoice.business.bankDetails,
      taxNumber: businessProfile?.taxNumber || sampleInvoice.business.taxNumber,
    },
  };

  const filteredTemplates = TEMPLATE_LIST.filter((tpl) => {
    if (filter === "all") return true;
    if (filter === "minimal")
      return ["minimal", "wave", "compact"].includes(tpl.slug);
    if (filter === "corporate")
      return ["corporate", "classic", "royal-blue"].includes(tpl.slug);
    if (filter === "creative")
      return ["agency-sidebar", "amber-grid", "crimson"].includes(tpl.slug);
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E8E5] pb-4">
        <div className="flex items-center gap-1.5 bg-[#FAFAF8] p-1 rounded-xl border border-[#E8E8E5]">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-white text-[#202124] shadow-2xs font-semibold"
                : "text-[#70757A] hover:text-[#202124]"
            }`}
          >
            All Templates ({TEMPLATE_LIST.length})
          </button>
          <button
            onClick={() => setFilter("minimal")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === "minimal"
                ? "bg-white text-[#202124] shadow-2xs font-semibold"
                : "text-[#70757A] hover:text-[#202124]"
            }`}
          >
            Minimal & Clean
          </button>
          <button
            onClick={() => setFilter("creative")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === "creative"
                ? "bg-white text-[#202124] shadow-2xs font-semibold"
                : "text-[#70757A] hover:text-[#202124]"
            }`}
          >
            Studio & Creative
          </button>
          <button
            onClick={() => setFilter("corporate")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === "corporate"
                ? "bg-white text-[#202124] shadow-2xs font-semibold"
                : "text-[#70757A] hover:text-[#202124]"
            }`}
          >
            Corporate & Ledger
          </button>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Grid of Real Rendered Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => {
          const isDefault = currentDefault === tpl.slug;

          return (
            <div
              key={tpl.slug}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-subtle hover:shadow-card hover:border-[#4468E8]/50 group ${
                isDefault ? "border-[#4468E8] ring-2 ring-[#4468E8]/20" : "border-[#E8E8E5]"
              }`}
            >
              <div>
                {/* Real Rendered Miniature Container */}
                <div className="relative h-64 bg-[#FAFAF8] border-b border-[#E8E8E5] overflow-hidden">
                  {/* Miniature Invoice Viewport scaled down */}
                  <div className="absolute top-0 left-0 w-[720px] pointer-events-none select-none origin-top-left transform scale-[0.38] md:scale-[0.41] shadow-md border border-[#E8E8E5]">
                    <InvoiceRenderer
                      invoice={activeInvoice}
                      templateId={tpl.slug}
                      accentColor={tpl.accentColor}
                    />
                  </div>

                  {/* Gradient Fade Overlay at bottom of thumbnail */}
                  <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setSelectedPreviewTemplate(tpl.slug)}
                      className="px-3 py-2 bg-white text-[#202124] rounded-lg text-xs font-semibold shadow-md hover:bg-[#FAFAF8] flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#4468E8]" />
                      <span>Full Preview</span>
                    </button>
                    <Link
                      href={`/invoices/new?template=${tpl.slug}`}
                      className="px-3 py-2 bg-[#4468E8] text-white rounded-lg text-xs font-semibold shadow-md hover:bg-[#3455D1] flex items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <span>Select</span>
                    </Link>
                  </div>

                  {/* Default Template Badge */}
                  {isDefault && (
                    <div className="absolute top-3 right-3 bg-[#4468E8] text-white px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs z-10">
                      <Check className="w-3 h-3" />
                      <span>Current Default</span>
                    </div>
                  )}
                </div>

                {/* Template Info Content */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-base text-[#202124]">
                      {tpl.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tpl.accentColor || "#202124" }}
                        title="Primary template accent"
                      />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#70757A] px-2 py-0.5 rounded bg-[#FAFAF8] border border-[#E8E8E5]">
                        {tpl.fontStyle}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#70757A] leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewTemplate(tpl.slug)}
                  className="px-3 py-2 text-xs font-medium text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded-lg border border-[#E8E8E5] transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <Link
                  href={`/invoices/new?template=${tpl.slug}`}
                  className="flex-1 text-center py-2 px-3 text-xs font-medium rounded-lg text-white bg-[#202124] hover:bg-black transition-colors"
                >
                  Use This Template
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Full-Screen Preview Modal */}
      {selectedPreviewTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#E8E8E5] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-[#E8E8E5] flex items-center justify-between bg-[#FAFAF8]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  {TEMPLATE_LIST.find((t) => t.slug === selectedPreviewTemplate)?.name} Preview
                </h3>
                <p className="text-xs text-[#70757A]">
                  Rendered with realistic billing data and active CSS rules
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/invoices/new?template=${selectedPreviewTemplate}`}
                  className="px-4 py-2 bg-[#4468E8] hover:bg-[#3455D1] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  Use This Template
                </Link>
                <button
                  onClick={() => setSelectedPreviewTemplate(null)}
                  className="p-1.5 rounded-lg text-[#70757A] hover:text-[#202124] hover:bg-[#E8E8E5] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Document Body */}
            <div className="flex-1 overflow-auto p-3 sm:p-8 bg-[#F5F5F3] flex justify-start sm:justify-center">
              <div className="w-[760px] shrink-0 shadow-invoice rounded-lg overflow-hidden border border-[#E8E8E5] bg-white">
                <InvoiceRenderer
                  invoice={activeInvoice}
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
