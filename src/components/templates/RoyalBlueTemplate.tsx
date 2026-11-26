import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const RoyalBlueTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const {
    invoiceNumber,
    invoiceDate,
    dueDate,
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
    <div className="w-full bg-[#00338D] text-neutral-900 font-sans min-h-[900px] flex flex-col justify-between p-6 md:p-8">
      {/* Top Banner Header */}
      <div data-invoice-cat="header" className="flex justify-between items-start text-white pb-6 px-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Invoice
          </h1>
          <div className="mt-3 flex items-center gap-2">
            {business.logoUrl ? (
              <div className="bg-white/15 p-1 rounded-md flex items-center justify-center max-h-11 max-w-[120px]">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="max-h-8 max-w-full object-contain"
                />
              </div>
            ) : null}
            <span className="font-bold text-sm tracking-wide">
              {business.businessName}
            </span>
          </div>
        </div>

        <div className="text-right text-xs text-blue-100 space-y-1">
          <p className="font-bold text-white text-sm">Professional Document</p>
          {business.address && (
            <p className="whitespace-pre-line text-[11px] opacity-90">{business.address}</p>
          )}
          {business.phone && <p>{business.phone}</p>}
          {business.email && <p>{business.email}</p>}
          {business.website && <p>{business.website}</p>}
        </div>
      </div>

      {/* Main White Card Container */}
      <div className="bg-white rounded-t-2xl p-6 md:p-10 flex-1 flex flex-col justify-between shadow-lg">
        <div>
          {/* Metadata Split */}
          <div data-invoice-cat="body" className="grid grid-cols-2 gap-8 pb-8 border-b border-neutral-200 text-xs">
            <div>
              <span className="font-bold text-neutral-900 block mb-2 text-sm">
                Invoice Details
              </span>
              <div className="space-y-1.5 text-neutral-700">
                <div className="flex">
                  <span className="w-28 font-semibold text-neutral-900">Invoice #</span>
                  <span className="font-mono">{invoiceNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold text-neutral-900">Date of Issue</span>
                  <span>{formatDate(invoiceDate)}</span>
                </div>
                <div className="flex">
                  <span className="w-28 font-semibold text-neutral-900">Due Date</span>
                  <span>{formatDate(dueDate)}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="font-bold text-neutral-900 block mb-2 text-sm">
                BILL TO
              </span>
              <p className="font-bold text-neutral-900">{customer?.name || "Client"}</p>
              {customer?.companyName && (
                <p className="font-semibold text-neutral-700">{customer.companyName}</p>
              )}
              {customer?.address && (
                <p className="whitespace-pre-line text-neutral-600 mt-0.5">
                  {customer.address}
                </p>
              )}
              {customer?.email && <p className="text-neutral-600">{customer.email}</p>}
            </div>
          </div>

          {/* 5-Column Clean Table */}
          <div data-invoice-cat="table" className="py-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-neutral-900 text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
                  <th className="py-2.5 px-2">ITEM/SERVICE</th>
                  <th className="py-2.5 px-2 text-center w-20">QTY/HRS</th>
                  <th className="py-2.5 px-2 text-right w-24">RATE</th>
                  <th className="py-2.5 px-2 text-right w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3.5 px-2">
                      <p className="font-semibold text-neutral-900">{item.description}</p>
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono text-neutral-600">
                      {item.quantity} {item.unit || ""}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono text-neutral-600">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-3.5 px-2 text-right font-mono font-bold text-neutral-900">
                      {formatCurrency(item.lineTotal, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Financial & Terms Grid */}
          <div data-invoice-cat="total" className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-neutral-200 text-xs">
            <div className="space-y-4">
              <div>
                <span className="font-bold uppercase tracking-wider text-neutral-900 block mb-1">
                  TERMS
                </span>
                <p className="text-neutral-600 text-[11px] leading-relaxed">
                  {paymentTerms || "Payment due within terms of invoice date. Accepted payment methods: check, credit card, or ACH transfer."}
                </p>
              </div>

              {(notes || business.bankDetails) && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-900 block mb-1">
                    CONDITIONS / INSTRUCTIONS
                  </span>
                  {notes && <p className="text-neutral-600 text-[11px] mb-1">{notes}</p>}
                  {business.bankDetails && (
                    <p className="font-mono text-[10px] text-neutral-700 whitespace-pre-line bg-neutral-50 p-2 rounded border border-neutral-200">
                      {business.bankDetails}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2 max-w-xs ml-auto w-full">
              <div className="flex justify-between text-neutral-700 font-semibold">
                <span>Sub Total</span>
                <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">
                    -{formatCurrency(
                      discountType === "percentage" ? (subtotal * discount) / 100 : discount,
                      currency
                    )}
                  </span>
                </div>
              )}

              {taxRate > 0 && (
                <>
                  <div className="flex justify-between text-neutral-700">
                    <span>Tax Rate</span>
                    <span className="font-mono">{taxRate}%</span>
                  </div>
                  <div className="flex justify-between text-neutral-700">
                    <span>Tax</span>
                    <span className="font-mono">+{formatCurrency(taxTotal, currency)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-2 border-t-2 border-b-2 border-neutral-900 font-extrabold text-base text-neutral-900">
                <span className="uppercase tracking-wider">TOTAL</span>
                <span className="font-mono text-lg">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer Brand Bar */}
        <div className="pt-8 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-mono">
          <span>{business.businessName} &bull; Official Instrument</span>
          <span>Powered by Buno</span>
        </div>
      </div>
    </div>
  );
};
