import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const ElegantTemplate: React.FC<TemplateProps> = ({ invoice }) => {
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
    <div className="w-full bg-[#FAF9F5] text-[#242321] p-10 md:p-14 font-sans selection:bg-[#EADDCB] min-h-[900px] flex flex-col justify-between border border-[#E5E0D5]">
      <div>
        {/* Editorial Header */}
        <div className="flex justify-between items-start pb-10 border-b border-[#DDD7CD]">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8C8476] block mb-2">
              Billing Statement
            </span>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-[#1D1C1A]">
              {business.businessName}
            </h1>
            {business.website && (
              <p className="text-xs text-[#8C8476] mt-1 font-mono">{business.website}</p>
            )}
          </div>

          <div className="text-right">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.businessName}
                className="h-12 w-auto object-contain ml-auto mb-3"
              />
            ) : null}
            <div className="text-xl font-serif text-[#1D1C1A]">No. {invoiceNumber}</div>
            <div className="text-xs text-[#8C8476] mt-1">
              Issued on {formatDate(invoiceDate)}
            </div>
            <div className="text-xs text-[#8C8476]">
              Due by {formatDate(dueDate)}
            </div>
          </div>
        </div>

        {/* Client & Issuer Details */}
        <div className="grid grid-cols-2 gap-12 py-10 text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8476] mb-3">
              Prepared For
            </div>
            {customer ? (
              <>
                <p className="text-base font-serif text-[#1D1C1A]">{customer.name}</p>
                {customer.companyName && (
                  <p className="font-medium text-[#545049]">{customer.companyName}</p>
                )}
                {customer.address && (
                  <p className="text-[#756E63] whitespace-pre-line mt-1">
                    {customer.address}
                  </p>
                )}
                {customer.email && <p className="text-[#756E63]">{customer.email}</p>}
                {customer.taxNumber && (
                  <p className="text-[#8C8476] font-mono mt-1">VAT: {customer.taxNumber}</p>
                )}
              </>
            ) : (
              <p className="italic text-[#8C8476]">Client unassigned</p>
            )}
          </div>

          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8C8476] mb-3">
              Issued From
            </div>
            <p className="font-medium text-[#1D1C1A]">{business.ownerName || business.businessName}</p>
            {business.address && (
              <p className="text-[#756E63] whitespace-pre-line mt-1">{business.address}</p>
            )}
            {business.email && <p className="text-[#756E63]">{business.email}</p>}
            {business.phone && <p className="text-[#756E63]">{business.phone}</p>}
            {business.taxNumber && (
              <p className="text-[#8C8476] font-mono mt-1">Tax ID: {business.taxNumber}</p>
            )}
          </div>
        </div>

        {/* Elegant Items Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-[#1D1C1A] text-[10px] font-mono uppercase tracking-widest text-[#8C8476]">
                <th className="py-3 font-normal">Service Description</th>
                <th className="py-3 text-center w-16 font-normal">Units</th>
                <th className="py-3 text-right w-24 font-normal">Rate</th>
                <th className="py-3 text-right w-28 font-normal">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5DC]">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="py-4 pr-4">
                    <p className="font-serif text-sm text-[#1D1C1A]">{item.description}</p>
                  </td>
                  <td className="py-4 text-center font-mono text-[#756E63]">
                    {item.quantity} {item.unit || ""}
                  </td>
                  <td className="py-4 text-right font-mono text-[#756E63]">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-4 text-right font-mono font-medium text-[#1D1C1A]">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-8 border-t border-[#DDD7CD]">
          <div className="w-full sm:w-1/2 text-xs text-[#756E63] space-y-3">
            {business.bankDetails && (
              <div className="bg-white/60 p-4 rounded border border-[#E5E0D5]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#8C8476] block mb-1">
                  Settlement Details
                </span>
                <p className="font-mono text-[11px] whitespace-pre-line text-[#403D37]">
                  {business.bankDetails}
                </p>
              </div>
            )}
            {paymentTerms && (
              <p>
                <span className="font-medium text-[#1D1C1A]">Terms:</span> {paymentTerms}
              </p>
            )}
            {notes && (
              <p className="italic text-[#756E63]">
                <span className="font-serif not-italic text-[#1D1C1A]">Note:</span> {notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[#756E63]">
              <span>Subtotal</span>
              <span className="font-mono text-[#1D1C1A]">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
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
              <div className="flex justify-between text-[#756E63]">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono text-[#1D1C1A]">
                  +{formatCurrency(taxTotal, currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-[#1D1C1A] text-base font-serif text-[#1D1C1A]">
              <span>Total Balance</span>
              <span className="font-mono font-bold">{formatCurrency(total, currency)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between text-[#756E63] text-xs">
                  <span>Settled Amount</span>
                  <span className="font-mono">-{formatCurrency(amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#DDD7CD] font-medium text-sm text-[#1D1C1A]">
                  <span>Remaining Due</span>
                  <span className="font-mono font-bold text-amber-900">
                    {formatCurrency(balanceDue, currency)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Elegant Footer */}
      <div className="pt-10 mt-10 border-t border-[#E5E0D5] text-center text-xs text-[#8C8476] font-serif italic">
        With appreciation for your enduring trust and partnership.
      </div>
    </div>
  );
};
