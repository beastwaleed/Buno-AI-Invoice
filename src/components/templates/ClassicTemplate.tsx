import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const ClassicTemplate: React.FC<TemplateProps> = ({ invoice }) => {
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
    <div className="w-full bg-white text-[#1f2937] p-8 md:p-12 font-serif min-h-[900px] flex flex-col justify-between border-8 border-double border-slate-200">
      <div>
        {/* Classic Header with Double Border */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-900">
                INVOICE
              </h1>
              <p className="font-sans text-xs text-slate-500 mt-1">
                Original Commercial Instrument
              </p>
            </div>
            <div className="text-right">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="h-12 w-auto object-contain ml-auto mb-2"
                />
              ) : null}
              <div className="text-xl font-bold font-sans text-slate-800">
                {business.businessName}
              </div>
              {business.registrationNumber && (
                <div className="font-sans text-xs text-slate-500">
                  Reg: {business.registrationNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Box */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-300 font-sans text-xs mb-6">
          <div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-semibold text-slate-700">Invoice No:</span>
              <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
              <span className="font-semibold text-slate-700">Date of Issue:</span>
              <span>{formatDate(invoiceDate)}</span>
              <span className="font-semibold text-slate-700">Payment Due:</span>
              <span className="font-bold text-slate-900">{formatDate(dueDate)}</span>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-semibold text-slate-700">Currency:</span>
              <span>{currency}</span>
              <span className="font-semibold text-slate-700">Tax ID:</span>
              <span className="font-mono">{business.taxNumber || "N/A"}</span>
              <span className="font-semibold text-slate-700">Terms:</span>
              <span>{paymentTerms || "Standard"}</span>
            </div>
          </div>
        </div>

        {/* Client & Issuer Columns */}
        <div className="grid grid-cols-2 gap-8 mb-6 font-sans text-xs">
          <div className="border-l-2 border-slate-400 pl-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Issued By
            </span>
            <p className="font-bold text-slate-900">{business.businessName}</p>
            {business.address && (
              <p className="text-slate-600 whitespace-pre-line">{business.address}</p>
            )}
            {business.email && <p className="text-slate-600">{business.email}</p>}
            {business.phone && <p className="text-slate-600">{business.phone}</p>}
          </div>

          <div className="border-l-2 border-slate-800 pl-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Bill To
            </span>
            {customer ? (
              <>
                <p className="font-bold text-slate-900">{customer.name}</p>
                {customer.companyName && (
                  <p className="font-medium text-slate-700">{customer.companyName}</p>
                )}
                {customer.address && (
                  <p className="text-slate-600 whitespace-pre-line">{customer.address}</p>
                )}
                {customer.email && <p className="text-slate-600">{customer.email}</p>}
                {customer.taxNumber && (
                  <p className="font-mono text-slate-600">VAT: {customer.taxNumber}</p>
                )}
              </>
            ) : (
              <p className="italic text-slate-400">Recipient unassigned</p>
            )}
          </div>
        </div>

        {/* Traditional Framed Table */}
        <div className="border border-slate-400 font-sans text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-200 border-b border-slate-400 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">#</th>
                <th className="py-2.5 px-3 border-r border-slate-300">Description of Service / Goods</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24">Unit Price</th>
                <th className="py-2.5 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 1 ? "bg-slate-50/70" : ""}>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-800">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono">
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-right font-mono">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Traditional Totals & Summary Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mt-6 font-sans text-xs">
          <div className="w-full sm:w-1/2 space-y-3">
            {business.bankDetails && (
              <div className="border border-slate-300 p-3 bg-slate-50">
                <span className="font-bold text-slate-800 block mb-1">
                  Remittance / Bank Instructions:
                </span>
                <p className="font-mono text-[11px] whitespace-pre-line text-slate-700">
                  {business.bankDetails}
                </p>
              </div>
            )}
            {notes && (
              <p className="italic text-slate-600">
                <span className="font-bold not-italic">Notes:</span> {notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 border border-slate-400 bg-slate-50 divide-y divide-slate-300">
            <div className="flex justify-between p-2">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between p-2 text-emerald-700">
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
              <div className="flex justify-between p-2 text-slate-600">
                <span>Sales Tax ({taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(taxTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between p-2.5 bg-slate-200 font-bold text-sm text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono">{formatCurrency(total, currency)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between p-2 text-slate-600">
                  <span>Less Payments:</span>
                  <span className="font-mono">-{formatCurrency(amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-900 text-white font-bold">
                  <span>Amount Due:</span>
                  <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Signature & Classic Footer */}
      <div className="pt-10 mt-8 border-t border-slate-300 font-sans text-xs">
        <div className="flex justify-between items-end">
          <div className="text-[11px] text-slate-500">
            Certified accurate and conforming to professional accounting records.
          </div>
          <div className="text-center w-48 border-t border-slate-400 pt-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
              Authorized Signature
            </span>
            <span className="font-serif italic text-sm text-slate-800">
              {business.ownerName || business.businessName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
