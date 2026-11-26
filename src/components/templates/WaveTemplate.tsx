import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const WaveTemplate: React.FC<TemplateProps> = ({ invoice }) => {
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
    <div className="w-full bg-white text-[#202124] p-8 md:p-12 font-sans min-h-[900px] flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Header Bar */}
        <div data-invoice-cat="header" className="flex justify-between items-start pb-6">
          <div>
            {business.logoUrl ? (
              <div data-invoice-cat="logo" className="inline-block">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  data-invoice-logo="true"
                  className="h-10 w-auto object-contain mb-2"
                />
              </div>
            ) : (
              <div className="text-xs font-bold tracking-widest uppercase text-neutral-400">
                YOUR LOGO
              </div>
            )}
            <div className="text-sm font-semibold text-[#202124]">
              {business.businessName}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">
              NO. {invoiceNumber}
            </span>
          </div>
        </div>

        {/* Big Bold INVOICE Title */}
        <div data-invoice-cat="header" className="pt-4 pb-6">
          <h1 className="text-5xl font-black tracking-tight text-neutral-900">
            INVOICE
          </h1>
          <p className="text-xs font-medium text-neutral-600 mt-2">
            Date: {formatDate(invoiceDate)}
          </p>
        </div>

        {/* Billed To / From Split */}
        <div data-invoice-cat="body" className="grid grid-cols-2 gap-8 py-6 text-xs text-neutral-600">
          <div>
            <span className="font-bold text-neutral-900 block mb-1">Billed to:</span>
            <p className="font-semibold text-neutral-800">{customer?.name || "Client"}</p>
            {customer?.companyName && <p>{customer.companyName}</p>}
            {customer?.address && (
              <p className="whitespace-pre-line text-neutral-500 mt-0.5">
                {customer.address}
              </p>
            )}
            {customer?.email && <p className="text-neutral-500">{customer.email}</p>}
          </div>

          <div>
            <span className="font-bold text-neutral-900 block mb-1">From:</span>
            <p className="font-semibold text-neutral-800">
              {business.ownerName || business.businessName}
            </p>
            {business.address && (
              <p className="whitespace-pre-line text-neutral-500 mt-0.5">
                {business.address}
              </p>
            )}
            {business.email && <p className="text-neutral-500">{business.email}</p>}
            {business.phone && <p className="text-neutral-500">{business.phone}</p>}
          </div>
        </div>

        {/* Table with subtle gray header */}
        <div data-invoice-cat="table" className="my-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 font-semibold text-[11px]">
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3 text-center w-20">Quantity</th>
                <th className="py-2.5 px-3 text-right w-24">Price</th>
                <th className="py-2.5 px-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-3 font-medium text-neutral-800">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-neutral-600">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-neutral-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-neutral-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total row with underline */}
          <div data-invoice-cat="total" className="flex justify-between items-center py-4 border-t border-b border-neutral-300 font-bold text-sm text-neutral-900 mt-2 px-3">
            <span>Total</span>
            <span className="font-mono text-base">{formatCurrency(total, currency)}</span>
          </div>
        </div>

        {/* Payment & Notes */}
        <div data-invoice-cat="total" className="text-xs text-neutral-600 space-y-1.5 pt-4">
          {paymentTerms && (
            <p>
              <span className="font-bold text-neutral-900">Payment terms:</span>{" "}
              {paymentTerms}
            </p>
          )}
          {business.bankDetails && (
            <p className="font-mono text-[11px] whitespace-pre-line text-neutral-600">
              {business.bankDetails}
            </p>
          )}
          {notes && (
            <p>
              <span className="font-bold text-neutral-900">Note:</span> {notes}
            </p>
          )}
        </div>
      </div>

      {/* Decorative Wave Graphic Footer */}
      <div className="w-full mt-12 relative -mx-8 -mb-12 pointer-events-none">
        <svg
          viewBox="0 0 500 120"
          preserveAspectRatio="none"
          className="w-full h-24 block"
        >
          <path
            d="M0,40 C150,110 350,-20 500,50 L500,120 L0,120 Z"
            fill="#CBD5E1"
            opacity="0.4"
          />
          <path
            d="M0,60 C180,120 320,10 500,70 L500,120 L0,120 Z"
            fill="#334155"
          />
        </svg>
      </div>
    </div>
  );
};
