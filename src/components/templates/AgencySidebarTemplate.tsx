import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const AgencySidebarTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const {
    invoiceNumber,
    invoiceDate,
    currency,
    subtotal,
    discount,
    discountType,
    taxRate,
    taxTotal,
    total,
    notes,
    paymentTerms,
    business,
    customer,
    items,
  } = invoice;

  return (
    <div className="w-[760px] bg-[#F4F5F7] text-[#1C1E21] font-sans min-h-[980px] flex relative overflow-hidden shadow-sm selection:bg-orange-100">
      {/* Top Right Orange Quarter-Circle Graphic */}
      <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden z-10">
        <div className="w-24 h-24 bg-[#DE6838] rounded-bl-full" />
      </div>

      {/* LEFT COLUMN: Full Height Elegant Dark Sidebar */}
      <div className="w-[240px] shrink-0 flex flex-col justify-between z-10 bg-[#1E2125] text-white p-6 shadow-sm">
        <div className="space-y-6">
          {/* Agency Brand Logo */}
          <div className="flex items-center gap-2.5">
            {business.logoUrl ? (
              <div className="bg-white/10 rounded-lg p-1.5 flex items-center justify-center max-h-12 max-w-[130px] overflow-hidden border border-white/10">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="max-h-9 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#DE6838] flex items-center justify-center text-white font-black text-sm shadow-sm">
                &diams;
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-xs tracking-wider uppercase text-white block truncate leading-tight">
                {business.businessName || "CREATIVE"}
              </span>
              <span className="text-[8px] uppercase tracking-widest text-[#9CA3AF]">
                STUDIO
              </span>
            </div>
          </div>

          {/* Invoice To Block */}
          <div className="space-y-1 text-xs">
            <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block">
              Invoice To:
            </span>
            <p className="font-bold text-white text-xs leading-snug">
              {customer?.name || "Elena Rostova"}
            </p>
            {customer?.companyName && (
              <p className="text-white/80 text-[11px] font-medium">{customer.companyName}</p>
            )}
            {customer?.phone && (
              <p className="text-[#9CA3AF] text-[10px]">P : {customer.phone}</p>
            )}
            {customer?.email && (
              <p className="text-[#9CA3AF] text-[10px] truncate">
                M : {customer.email}
              </p>
            )}
            {customer?.address && (
              <p className="text-[#9CA3AF] text-[10px] whitespace-pre-line leading-relaxed pt-0.5">
                {customer.address}
              </p>
            )}
          </div>

          {/* Orange Horizontal Divider Rule */}
          <div className="w-8 h-0.5 bg-[#DE6838] rounded-full" />

          {/* Payment Method / Bank Details */}
          <div className="space-y-1 text-xs">
            <span className="text-[9px] font-semibold text-[#9CA3AF] uppercase tracking-wider block">
              Payment Method:
            </span>
            {business.bankDetails ? (
              <p className="font-mono text-[10px] text-[#D1D5DB] whitespace-pre-line leading-relaxed">
                {business.bankDetails}
              </p>
            ) : (
              <div className="text-[10px] text-[#D1D5DB] space-y-0.5">
                <p>&bull; Silicon Valley Bank</p>
                <p>&bull; Acct: 4892-8193-8481</p>
                <p>&bull; Routing: 121000358</p>
                <p>&bull; Swift: SVBUS6S</p>
              </div>
            )}
          </div>

          {/* Additional Studio Metadata */}
          {business.taxNumber && (
            <div className="text-[10px] text-[#9CA3AF] space-y-0.5 pt-1">
              <span className="text-[9px] font-semibold uppercase tracking-wider block text-[#D1D5DB]">
                Tax Registration:
              </span>
              <p className="font-mono">{business.taxNumber}</p>
            </div>
          )}

          {/* Decorative Dot Matrix (2 rows of 4 dots) */}
          <div className="grid grid-cols-4 gap-1.5 w-12 opacity-30 pt-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* Lower Sidebar Area: Terms & Conditions and Reference */}
        <div className="space-y-3 pt-6 border-t border-white/10 shrink-0">
          {/* Decorative Horizontal Lines + Orange Cross */}
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-[#DE6838] font-black text-lg select-none leading-none">&times;</span>
            <div className="space-y-1">
              <div className="w-6 h-0.5 bg-white/40" />
              <div className="w-4 h-0.5 bg-white/40" />
            </div>
          </div>

          {/* Term & Condition */}
          <div className="space-y-1 text-xs">
            <span className="font-bold text-white uppercase tracking-wider text-[10px] block">
              Term & Condition:
            </span>
            <p className="text-[10px] text-[#9CA3AF] leading-relaxed">
              {paymentTerms || notes || "All invoices must be settled in full prior to release of final source production assets."}
            </p>
            {/* 6 Decorative Dots Matrix (3x2) */}
            <div className="grid grid-cols-3 gap-1 w-6 opacity-30 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-white" />
              ))}
            </div>
          </div>

          {/* Reference Number */}
          <div className="text-[9px] font-mono text-[#9CA3AF] tracking-wider pt-1">
            REF: {invoiceNumber}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Main Invoice Content (INVOICE title, Total Due, Table, Totals, Signature) */}
      <div className="flex-1 min-w-0 p-6 md:p-8 flex flex-col justify-between relative bg-[#F4F5F7]">
        <div>
          {/* Top Header: INVOICE title & Total Due (stacked on the left exactly matching the reference) */}
          <div className="flex justify-between items-start pb-5">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-[#1C1E21] tracking-tight uppercase leading-none">
                INVOICE
              </h1>

              {/* Total Due Stack directly below INVOICE */}
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-[#70757A] uppercase tracking-wider block">
                  Total Due :
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-2xl font-mono font-black text-[#1C1E21] tracking-tight">
                    {currency} : {formatCurrency(total, currency)}
                  </span>
                  {/* 6 Decorative Dots Matrix (3x2) */}
                  <div className="grid grid-cols-3 gap-1 opacity-30">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#1C1E21]" />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#70757A] font-mono pt-0.5">
                Invoice Date: {formatDate(invoiceDate)}
              </p>
            </div>

            {/* Top Right Decorative Orange Cross (below the corner quarter circle) */}
            <div className="pr-10 pt-2">
              <span className="text-[#DE6838] font-bold text-2xl select-none">&times;</span>
            </div>
          </div>

          {/* Rounded Terracotta Table Header */}
          <div className="my-4 overflow-hidden rounded-xl bg-white shadow-2xs border border-[#E8E8E5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#DE6838] text-white font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">Qut</th>
                  <th className="py-2.5 px-4">Product & Services</th>
                  <th className="py-2.5 px-4 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {items.map((item, index) => (
                  <tr key={index} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-medium text-[#70757A] text-[11px]">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#1C1E21] text-xs">{item.description}</p>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        {item.quantity} {item.unit || "unit"} &times; {formatCurrency(item.unitPrice, currency)}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1C1E21] text-xs">
                      {formatCurrency(item.lineTotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-3">
            <div className="w-60 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#70757A] px-2">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 px-2 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">
                    -{formatCurrency(
                      discountType === "percentage" ? (subtotal * discount) / 100 : discount,
                      currency
                    )}
                  </span>
                </div>
              )}

              {taxRate > 0 && (
                <div className="flex justify-between text-[#70757A] px-2">
                  <span>Tax [{taxRate}%]:</span>
                  <span className="font-mono font-medium">+{formatCurrency(taxTotal, currency)}</span>
                </div>
              )}

              {/* Solid Terracotta Grand Total Pill Badge */}
              <div className="bg-[#DE6838] text-white py-2.5 px-4 rounded-xl font-bold flex justify-between items-center text-xs shadow-sm mt-2">
                <span className="uppercase tracking-wider">Grand Total:</span>
                <span className="font-mono text-sm tracking-tight">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Signature Line */}
        <div className="pt-6 border-t border-[#E8E8E5] flex justify-end items-end mt-8">
          <div className="text-center w-52">
            {/* Signature Font / Script Style */}
            <span className="font-serif italic text-2xl text-[#1C1E21] block tracking-tight">
              {business.ownerName || "Alexander Wright"}
            </span>
            <div className="border-t border-[#1C1E21] mt-1 pt-1">
              <span className="text-[9px] text-[#70757A] uppercase tracking-widest block font-medium">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
