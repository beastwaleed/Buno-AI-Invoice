import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Phone, Mail, MapPin } from "lucide-react";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const AmberGridTemplate: React.FC<TemplateProps> = ({ invoice }) => {
  const {
    invoiceNumber,
    invoiceDate,
    currency,
    total,
    notes,
    business,
    customer,
    items,
  } = invoice;

  return (
    <div className="w-full bg-white text-neutral-900 p-8 md:p-12 font-sans min-h-[900px] flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div data-invoice-cat="header" className="flex justify-between items-start pb-8">
          <div>
            {business.logoUrl ? (
              <div data-invoice-cat="logo" className="inline-block">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  data-invoice-logo="true"
                  className="h-10 w-auto object-contain mb-3 max-w-[140px]"
                />
              </div>
            ) : null}
            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight">
              Invoice
            </h1>
            <p className="text-xs font-semibold text-neutral-600 mt-0.5">
              {business.businessName}
            </p>

            <div data-invoice-cat="body" className="mt-4 space-y-2 text-xs text-neutral-700">
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium text-neutral-600">Date:</span>
                <span className="border-b border-neutral-400 pb-0.5 px-2 font-mono flex-1">
                  {formatDate(invoiceDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium text-neutral-600">Invoice number:</span>
                <span className="border-b border-neutral-400 pb-0.5 px-2 font-mono flex-1">
                  {invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 font-medium text-neutral-600">Billed to:</span>
                <span className="border-b border-neutral-400 pb-0.5 px-2 font-medium flex-1">
                  {customer?.name || "Client"}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs space-y-1 text-neutral-800">
            <span className="font-semibold block text-neutral-900">Payment Method:</span>
            {business.bankDetails ? (
              <p className="whitespace-pre-line font-mono text-[11px] text-neutral-700">
                {business.bankDetails}
              </p>
            ) : (
              <p className="font-mono text-[11px]">Bank Wire / Direct Transfer</p>
            )}
          </div>
        </div>

        {/* Boxed Grid Table with Yellow Header */}
        <div data-invoice-cat="table" className="my-6 border-2 border-neutral-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFD700] text-neutral-900 font-bold uppercase tracking-wider text-[11px] border-b-2 border-neutral-900">
                <th className="py-2.5 px-3 border-r-2 border-neutral-900">Description</th>
                <th className="py-2.5 px-3 border-r-2 border-neutral-900 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 border-r-2 border-neutral-900 text-right w-24">Price</th>
                <th className="py-2.5 px-3 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y border-neutral-900 divide-neutral-900">
              {items.map((item, index) => (
                <tr key={index} className="border-b border-neutral-900">
                  <td className="py-3 px-3 border-r border-neutral-900 font-medium text-neutral-900">
                    {item.description}
                  </td>
                  <td className="py-3 px-3 border-r border-neutral-900 text-center font-mono">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-3 border-r border-neutral-900 text-right font-mono">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-neutral-900">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
              {/* Extra empty rows to complete traditional invoice look */}
              {Array.from({ length: Math.max(0, 5 - items.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-neutral-900 h-8">
                  <td className="border-r border-neutral-900"></td>
                  <td className="border-r border-neutral-900"></td>
                  <td className="border-r border-neutral-900"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yellow Total Block */}
        <div data-invoice-cat="total" className="flex justify-end my-4">
          <div className="flex border-2 border-neutral-900">
            <div className="bg-[#FFD700] px-6 py-2 text-xs font-bold text-neutral-900 uppercase tracking-wider border-r-2 border-neutral-900 flex items-center">
              total :
            </div>
            <div className="px-6 py-2 font-mono font-bold text-base text-neutral-900 min-w-[120px] text-right flex items-center justify-end">
              {formatCurrency(total, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Thank You & Contact Info */}
      <div className="pt-8 grid grid-cols-2 gap-8 items-end border-t border-neutral-200 mt-12">
        <div>
          <h2 className="text-xl font-black uppercase text-neutral-900 tracking-tight">
            THANK YOU
          </h2>
          <div className="mt-3 space-y-1.5 text-xs text-neutral-700">
            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-900" />
                <span>{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-neutral-900" />
                <span>{business.email}</span>
              </div>
            )}
            {business.address && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-neutral-900" />
                <span>{business.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b border-neutral-400 pb-1 text-xs text-neutral-500 italic">
            {notes || "Payment is appreciated within terms."}
          </div>
          <div className="border-b border-neutral-400 h-4"></div>
          <div className="border-b border-neutral-400 h-4"></div>
        </div>
      </div>
    </div>
  );
};
