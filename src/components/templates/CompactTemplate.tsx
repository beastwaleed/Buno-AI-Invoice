import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const CompactTemplate: React.FC<TemplateProps> = ({ invoice }) => {
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
    amountPaid,
    balanceDue,
    notes,
    paymentTerms,
    business,
    customer,
    items,
  } = invoice;

  return (
    <div className="w-full bg-white text-neutral-800 p-6 md:p-8 font-sans text-xs min-h-[900px] flex flex-col justify-between border border-neutral-200">
      <div>
        {/* Compact Header */}
        <div data-invoice-cat="header" className="flex justify-between items-center pb-4 border-b border-neutral-300">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.businessName}
                className="h-8 w-auto object-contain"
              />
            ) : null}
            <div>
              <span className="font-bold text-base text-neutral-900 block leading-tight">
                {business.businessName}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {business.email} {business.phone ? `| ${business.phone}` : ""}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="font-mono font-bold text-sm text-neutral-900 block">
              {invoiceNumber}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Issued: {formatDate(invoiceDate)} &bull; Due: {formatDate(dueDate)}
            </span>
          </div>
        </div>

        {/* Compact 3-Column Meta Strip */}
        <div data-invoice-cat="body" className="grid grid-cols-3 gap-2 py-3 border-b border-neutral-200 text-[11px] bg-neutral-50/50 px-2 rounded mt-2">
          <div>
            <span className="font-semibold text-neutral-500 block text-[9px] uppercase">
              Bill To:
            </span>
            <span className="font-bold text-neutral-900">{customer?.name || "Client"}</span>
            {customer?.companyName && <span> ({customer.companyName})</span>}
          </div>
          <div>
            <span className="font-semibold text-neutral-500 block text-[9px] uppercase">
              Terms & ID:
            </span>
            <span>{paymentTerms || "Net 14"}</span>
            {customer?.taxNumber && <span className="font-mono"> | VAT: {customer.taxNumber}</span>}
          </div>
          <div className="text-right">
            <span className="font-semibold text-neutral-500 block text-[9px] uppercase">
              Amount Due:
            </span>
            <span className="font-mono font-bold text-neutral-900 text-sm">
              {formatCurrency(balanceDue, currency)}
            </span>
          </div>
        </div>

        {/* High-Density Line Items Table */}
        <div data-invoice-cat="table" className="mt-3">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 font-semibold uppercase text-[9px] tracking-wider">
                <th className="py-1.5 px-2 w-8 text-center">#</th>
                <th className="py-1.5 px-2">Description</th>
                <th className="py-1.5 px-2 text-center w-12">Qty</th>
                <th className="py-1.5 px-2 text-right w-20">Price</th>
                <th className="py-1.5 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, index) => (
                <tr key={index} className="hover:bg-neutral-50/50">
                  <td className="py-1.5 px-2 text-center font-mono text-neutral-400 text-[10px]">
                    {index + 1}
                  </td>
                  <td className="py-1.5 px-2 font-medium text-neutral-800">
                    {item.description}
                  </td>
                  <td className="py-1.5 px-2 text-center font-mono text-neutral-600">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono text-neutral-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold text-neutral-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compact Totals & Footer Info */}
        <div data-invoice-cat="total" className="flex justify-between items-start pt-4 mt-2 border-t border-neutral-200">
          <div className="w-1/2 text-[10px] text-neutral-500 space-y-1">
            {business.bankDetails && (
              <p className="font-mono text-[9px] whitespace-pre-line text-neutral-600">
                {business.bankDetails}
              </p>
            )}
            {notes && <p className="italic">Note: {notes}</p>}
          </div>

          <div className="w-64 space-y-1 text-[11px]">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600">
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
              <div className="flex justify-between text-neutral-600">
                <span>Tax ({taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(taxTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-t border-neutral-800 font-bold text-xs text-neutral-900">
              <span>Total:</span>
              <span className="font-mono">{formatCurrency(total, currency)}</span>
            </div>
            {amountPaid > 0 && (
              <div className="flex justify-between text-xs text-neutral-500 font-medium">
                <span>Paid:</span>
                <span className="font-mono">-{formatCurrency(amountPaid, currency)}</span>
              </div>
            )}
            {amountPaid > 0 && (
              <div className="flex justify-between font-bold text-xs border-t border-neutral-200 pt-0.5">
                <span>Balance Due:</span>
                <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-[9px] text-neutral-400 font-mono pt-4 border-t border-neutral-100">
        Page 1 of 1 &bull; {business.businessName} &bull; {invoiceNumber}
      </div>
    </div>
  );
};
