import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const CorporateTemplate: React.FC<TemplateProps> = ({
  invoice,
  accentColor = "#1E3A5F",
}) => {
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
    <div className="w-full bg-white text-slate-800 p-8 md:p-12 font-sans min-h-[900px] flex flex-col justify-between border-t-8 border-[#1E3A5F]">
      <div>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.businessName}
                className="h-14 w-auto object-contain"
              />
            ) : (
              <div className="h-12 px-4 rounded bg-[#1E3A5F] text-white flex items-center font-bold tracking-widest text-lg">
                {business.businessName?.slice(0, 4).toUpperCase() || "CORP"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {business.businessName}
              </h1>
              <p className="text-xs text-slate-500">Corporate Billing & Settlement</p>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 text-left sm:text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block">
              Official Tax Invoice
            </span>
            <span className="text-2xl font-mono font-bold text-[#1E3A5F]">
              {invoiceNumber}
            </span>
          </div>
        </div>

        {/* Enterprise Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-4 my-6 text-xs">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Issue Date
            </span>
            <span className="font-semibold text-slate-900">{formatDate(invoiceDate)}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Due Date
            </span>
            <span className="font-semibold text-slate-900">{formatDate(dueDate)}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Tax / VAT ID
            </span>
            <span className="font-mono font-semibold text-slate-900">
              {business.taxNumber || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[10px]">
              Settlement Currency
            </span>
            <span className="font-semibold text-[#1E3A5F]">{currency}</span>
          </div>
        </div>

        {/* Sender & Receiver Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
          <div className="p-4 rounded border border-slate-200 bg-white shadow-sm">
            <div className="text-[10px] font-bold text-[#1E3A5F] uppercase tracking-wider mb-2">
              Issuer Entity Details
            </div>
            <p className="font-bold text-slate-900 text-sm">{business.businessName}</p>
            {business.address && (
              <p className="text-slate-600 whitespace-pre-line mt-1">{business.address}</p>
            )}
            {business.email && <p className="text-slate-600">{business.email}</p>}
            {business.phone && <p className="text-slate-600">{business.phone}</p>}
          </div>

          <div className="p-4 rounded border border-slate-200 bg-white shadow-sm">
            <div className="text-[10px] font-bold text-[#1E3A5F] uppercase tracking-wider mb-2">
              Corporate Account / Billed To
            </div>
            {customer ? (
              <>
                <p className="font-bold text-slate-900 text-sm">{customer.companyName || customer.name}</p>
                {customer.companyName && customer.name && (
                  <p className="text-slate-600">Attn: {customer.name}</p>
                )}
                {customer.address && (
                  <p className="text-slate-600 whitespace-pre-line mt-1">{customer.address}</p>
                )}
                {customer.email && <p className="text-slate-600">{customer.email}</p>}
                {customer.taxNumber && (
                  <p className="text-slate-600 font-mono mt-1">Tax ID: {customer.taxNumber}</p>
                )}
              </>
            ) : (
              <p className="italic text-slate-400">Account unassigned</p>
            )}
          </div>
        </div>

        {/* Full-width colored band table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1E3A5F] text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Item / Service Deliverable</th>
                <th className="py-3 px-3 text-center w-16">Qty</th>
                <th className="py-3 px-3 text-right w-24">Unit Rate</th>
                <th className="py-3 px-3 text-right w-28">Total ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200">
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 1 ? "bg-slate-50/50" : ""}>
                  <td className="py-3.5 px-3">
                    <p className="font-medium text-slate-900">{item.description}</p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Remittance Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mt-6">
          <div className="w-full sm:w-1/2 text-xs space-y-3">
            {business.bankDetails && (
              <div className="p-3.5 rounded bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Electronic Funds Transfer (EFT / Wire):
                </span>
                <p className="font-mono text-[11px] whitespace-pre-line text-slate-700">
                  {business.bankDetails}
                </p>
              </div>
            )}
            {paymentTerms && (
              <p className="text-slate-600">
                <span className="font-semibold text-slate-900">Payment Terms:</span> {paymentTerms}
              </p>
            )}
            {notes && (
              <p className="text-slate-600 italic">
                <span className="font-semibold not-italic text-slate-900">Remarks:</span> {notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs bg-slate-50 p-4 rounded border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Enterprise Rebate:</span>
                <span className="font-mono">
                  -{formatCurrency(
                    discountType === "percentage" ? (subtotal * discount) / 100 : discount,
                    currency
                  )}
                </span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Value Added Tax ({taxRate}%):</span>
                <span className="font-mono">+{formatCurrency(taxTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-[#1E3A5F] text-sm font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="font-mono text-[#1E3A5F]">{formatCurrency(total, currency)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Prepayments / Applied:</span>
                  <span className="font-mono">-{formatCurrency(amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-sm text-slate-900">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Corporate Remittance Footer */}
      <div className="pt-8 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-8">
        Corporate Accounting &bull; Reference {invoiceNumber} &bull; All Rights Reserved
      </div>
    </div>
  );
};
