import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const CrimsonTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const {
    invoiceNumber,
    invoiceDate,
    currency,
    total,
    notes,
    paymentTerms,
    business,
    customer,
    items,
  } = invoice;

  return (
    <div className="w-full bg-[#0E1E38] text-white font-sans min-h-[900px] flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Top Bold Red Header */}
        <div data-invoice-cat="header" className="bg-[#D91B24] p-8 md:p-10 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <div className="bg-white/15 p-1 rounded-lg flex items-center justify-center max-h-12 max-w-[120px]">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="max-h-9 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                &infin;
              </div>
            )}
            <div>
              <span className="font-bold text-lg leading-tight block">
                {business.businessName}
              </span>
              <span className="text-[11px] text-white/80">Official Service Invoice</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-wider uppercase">
            INVOICE
          </h1>
        </div>

        {/* Client & Date Details */}
        <div data-invoice-cat="body" className="p-8 md:p-10 pb-4 grid grid-cols-2 gap-8 text-xs text-slate-300">
          <div>
            <span className="font-semibold text-white block mb-1">Invoice To</span>
            <p className="font-bold text-white text-sm">{customer?.name || "Client"}</p>
            {customer?.phone && <p>{customer.phone}</p>}
            {customer?.email && <p>{customer.email}</p>}
            {customer?.address && <p className="whitespace-pre-line mt-0.5">{customer.address}</p>}
          </div>

          <div className="text-right space-y-1">
            <div>
              <span className="text-slate-400">Date : </span>
              <span className="font-mono text-white">{formatDate(invoiceDate)}</span>
            </div>
            <div>
              <span className="text-slate-400">Invoice No : </span>
              <span className="font-mono text-white">{invoiceNumber}</span>
            </div>
          </div>
        </div>

        {/* Sage Green Header Table */}
        <div data-invoice-cat="table" className="px-8 md:px-10 my-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#4E796B] text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3 w-12 text-center">NO</th>
                <th className="py-2.5 px-3">DESCRIPTION</th>
                <th className="py-2.5 px-3 text-center w-16">QTY</th>
                <th className="py-2.5 px-3 text-right w-24">PRICE</th>
                <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F3354]">
              {items.map((item, index) => (
                <tr key={index} className={index % 2 === 1 ? "bg-[#142948]" : ""}>
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 font-medium text-white">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand Total Row */}
          <div data-invoice-cat="total" className="flex justify-between items-center py-4 text-sm font-bold text-white mt-2 px-3 border-t border-[#1F3354]">
            <span className="uppercase tracking-widest text-xs text-slate-300">TOTAL</span>
            <span className="font-mono text-lg text-emerald-400">
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>

        {/* Terms & Payment Information with Script Signature */}
        <div data-invoice-cat="total" className="px-8 md:px-10 py-6 grid grid-cols-2 gap-8 text-xs text-slate-300">
          <div className="space-y-3">
            <div>
              <span className="font-bold text-white block mb-0.5">
                Terms and Conditions
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {paymentTerms || "Invoices must be paid within the specified timeframe stated on the invoice."}
              </p>
            </div>

            <div>
              <span className="font-bold text-white block mb-0.5">
                Payment Information
              </span>
              <p className="font-mono text-[11px] text-slate-400 whitespace-pre-line">
                {business.bankDetails || "Bank: Direct Wire Transfer\nRef: Quote invoice number"}
              </p>
            </div>
          </div>

          <div className="text-center flex flex-col justify-end items-end pr-4">
            <div className="text-center w-48">
              <span className="font-serif italic text-2xl text-white block mb-1">
                {business.ownerName || "Authorized Sign"}
              </span>
              <div className="border-t border-slate-600 pt-1">
                <span className="text-xs font-semibold text-white block">
                  {business.ownerName || business.businessName}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Administrator
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Accent Stripes at Bottom (Yellow & Green) */}
      <div className="w-full">
        <div className="h-2 bg-[#EAB308]"></div>
        <div className="h-3 bg-[#22C55E]"></div>
      </div>
    </div>
  );
};
