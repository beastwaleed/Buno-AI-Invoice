import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const ModernTemplate: React.FC<TemplateProps> = ({
  invoice,
  accentColor = "#4468E8",
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
    <div className="w-full bg-white text-[#202124] p-8 md:p-12 font-sans selection:bg-blue-100 min-h-[900px] flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-8 border-b border-[#E8E8E5] gap-4">
          <div className="flex items-center gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.businessName}
                className="h-12 w-auto object-contain max-w-[140px]"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {business.businessName?.charAt(0) || "B"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#202124]">
                {business.businessName || "Your Company Name"}
              </h1>
              {business.ownerName && (
                <p className="text-xs text-[#70757A]">{business.ownerName}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span
              className="inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider mb-1"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor,
              }}
            >
              Invoice
            </span>
            <div className="text-xl font-mono font-bold text-[#202124]">
              {invoiceNumber || "INV-0001"}
            </div>
          </div>
        </div>

        {/* Sender & Recipient Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 text-sm">
          <div>
            <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block mb-2">
              From
            </span>
            <p className="font-semibold text-[#202124]">{business.businessName}</p>
            {business.address && (
              <p className="text-[#70757A] whitespace-pre-line mt-1">
                {business.address}
              </p>
            )}
            {business.email && <p className="text-[#70757A]">{business.email}</p>}
            {business.phone && <p className="text-[#70757A]">{business.phone}</p>}
            {business.taxNumber && (
              <p className="text-xs text-[#70757A] mt-1 font-mono">
                Tax ID: {business.taxNumber}
              </p>
            )}
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block mb-2">
              Billed To
            </span>
            {customer ? (
              <>
                <p className="font-semibold text-[#202124]">{customer.name}</p>
                {customer.companyName && (
                  <p className="text-[#70757A]">{customer.companyName}</p>
                )}
                {customer.address && (
                  <p className="text-[#70757A] whitespace-pre-line mt-1">
                    {customer.address}
                  </p>
                )}
                {customer.email && <p className="text-[#70757A]">{customer.email}</p>}
                {customer.taxNumber && (
                  <p className="text-xs text-[#70757A] mt-1 font-mono">
                    VAT / Tax ID: {customer.taxNumber}
                  </p>
                )}
              </>
            ) : (
              <p className="text-[#70757A] italic">No customer specified</p>
            )}

            <div className="mt-4 pt-3 border-t border-[#F0F0EE] inline-block text-left sm:text-right">
              <div className="text-xs text-[#70757A]">
                <span className="font-medium text-[#202124]">Invoice Date:</span>{" "}
                {formatDate(invoiceDate)}
              </div>
              <div className="text-xs text-[#70757A] mt-0.5">
                <span className="font-medium text-[#202124]">Due Date:</span>{" "}
                {formatDate(dueDate)}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto my-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E8E5] text-xs font-semibold uppercase tracking-wider text-[#70757A]">
                <th className="py-3 px-2">Description</th>
                <th className="py-3 px-2 text-center w-16">Qty</th>
                <th className="py-3 px-2 text-right w-24">Price</th>
                {items.some((i) => (i.discount || 0) > 0) && (
                  <th className="py-3 px-2 text-right w-20">Disc.</th>
                )}
                <th className="py-3 px-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EE]">
              {items.map((item, index) => (
                <tr key={index} className="group">
                  <td className="py-3.5 px-2">
                    <p className="font-medium text-[#202124]">
                      {item.description || "Untitled Item"}
                    </p>
                  </td>
                  <td className="py-3.5 px-2 text-center font-mono text-[#70757A]">
                    {item.quantity} {item.unit ? <span className="text-xs">{item.unit}</span> : ""}
                  </td>
                  <td className="py-3.5 px-2 text-right font-mono text-[#70757A]">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  {items.some((i) => (i.discount || 0) > 0) && (
                    <td className="py-3.5 px-2 text-right font-mono text-emerald-600 text-xs">
                      {item.discount > 0 ? `-${formatCurrency(item.discount, currency)}` : "—"}
                    </td>
                  )}
                  <td className="py-3.5 px-2 text-right font-mono font-medium text-[#202124]">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mt-6 pt-4 border-t border-[#E8E8E5]">
          <div className="w-full sm:w-1/2 text-xs text-[#70757A] space-y-3">
            {business.bankDetails && (
              <div className="bg-[#FAFAF8] p-3.5 rounded-lg border border-[#E8E8E5]">
                <span className="font-semibold text-[#202124] block mb-1">
                  Bank / Payment Transfer:
                </span>
                <p className="whitespace-pre-line font-mono text-[11px] text-[#475569]">
                  {business.bankDetails}
                </p>
              </div>
            )}
            {paymentTerms && (
              <p>
                <span className="font-semibold text-[#202124]">Terms:</span> {paymentTerms}
              </p>
            )}
            {notes && (
              <p className="whitespace-pre-line">
                <span className="font-semibold text-[#202124]">Notes:</span> {notes}
              </p>
            )}
          </div>

          <div className="w-full sm:w-1/2 max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between py-1 text-[#70757A]">
              <span>Subtotal</span>
              <span className="font-mono text-[#202124]">
                {formatCurrency(subtotal, currency)}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600">
                <span>
                  Discount {discountType === "percentage" ? `(${discount}%)` : ""}
                </span>
                <span className="font-mono">
                  -
                  {formatCurrency(
                    discountType === "percentage"
                      ? (subtotal * discount) / 100
                      : discount,
                    currency
                  )}
                </span>
              </div>
            )}

            {taxRate > 0 && (
              <div className="flex justify-between py-1 text-[#70757A]">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono text-[#202124]">
                  +{formatCurrency(taxTotal, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between py-2 border-t-2 border-[#202124] font-bold text-base text-[#202124]">
              <span>Total</span>
              <span className="font-mono text-lg" style={{ color: accentColor }}>
                {formatCurrency(total, currency)}
              </span>
            </div>

            {amountPaid > 0 && (
              <>
                <div className="flex justify-between py-1 text-emerald-600 text-xs font-medium">
                  <span>Amount Paid</span>
                  <span className="font-mono">
                    -{formatCurrency(amountPaid, currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-[#E8E8E5] font-bold text-sm text-[#202124]">
                  <span>Balance Due</span>
                  <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-12 text-center text-[11px] text-[#A0A5AA] border-t border-[#F0F0EE] mt-8">
        <p>Thank you for your business. Generated by Buno.</p>
      </div>
    </div>
  );
};
