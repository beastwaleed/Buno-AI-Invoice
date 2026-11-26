import React from "react";
import { InvoiceData } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TemplateProps {
  invoice: InvoiceData;
  accentColor?: string;
}

export const MinimalTemplate: React.FC<TemplateProps> = ({ invoice }) => {
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
    <div className="w-full bg-white text-black p-10 md:p-16 font-sans selection:bg-neutral-200 min-h-[900px] flex flex-col justify-between">
      <div>
        {/* Minimal Header */}
        <div data-invoice-cat="header" className="flex justify-between items-start pb-12">
          <div>
            {business.logoUrl ? (
              <div data-invoice-cat="logo" className="inline-block">
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  data-invoice-logo="true"
                  className="h-10 w-auto object-contain mb-3"
                />
              </div>
            ) : null}
            <h1 data-invoice-text="business-name" className="text-2xl font-normal tracking-tight">
              {business.businessName || "Invoice"}
            </h1>
            <p data-invoice-text="title" className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-mono">
              INVOICE #{invoiceNumber}
            </p>
          </div>

          <div data-invoice-text="invoice-meta" className="text-right text-xs space-y-1 text-neutral-600 font-mono">
            <div>
              <span className="text-neutral-400">Date:</span> {formatDate(invoiceDate)}
            </div>
            <div>
              <span className="text-neutral-400">Due:</span> {formatDate(dueDate)}
            </div>
          </div>
        </div>

        {/* Minimal Sender / Client Grid */}
        <div data-invoice-cat="body" className="grid grid-cols-2 gap-12 pb-12 border-b border-neutral-200 text-xs text-neutral-600 leading-relaxed">
          <div>
            <div data-invoice-text="issuer-title" className="uppercase tracking-widest text-[10px] text-neutral-400 mb-2">
              Issuer
            </div>
            <div data-invoice-text="business-name" className="font-medium text-black">{business.businessName}</div>
            <div data-invoice-text="business-details">
              {business.address && <div className="whitespace-pre-line">{business.address}</div>}
              {business.email && <div>{business.email}</div>}
              {business.taxNumber && <div className="font-mono mt-1">Tax: {business.taxNumber}</div>}
            </div>
          </div>

          <div>
            <div data-invoice-text="client-title" className="uppercase tracking-widest text-[10px] text-neutral-400 mb-2">
              Client
            </div>
            {customer ? (
              <>
                <div data-invoice-text="client-name" className="font-medium text-black">{customer.name}</div>
                <div data-invoice-text="client-details">
                  {customer.companyName && <div>{customer.companyName}</div>}
                  {customer.address && <div className="whitespace-pre-line">{customer.address}</div>}
                  {customer.email && <div>{customer.email}</div>}
                  {customer.taxNumber && <div className="font-mono mt-1">VAT: {customer.taxNumber}</div>}
                </div>
              </>
            ) : (
              <div className="italic text-neutral-400">No client details</div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div data-invoice-cat="table" className="py-8">
          <table className="w-full text-left text-xs">
            <thead data-invoice-text="table-head">
              <tr className="border-b border-black text-black font-medium uppercase tracking-wider text-[11px]">
                <th className="py-3">Item</th>
                <th className="py-3 text-center w-16">Qty</th>
                <th className="py-3 text-right w-24">Rate</th>
                <th className="py-3 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((item, index) => (
                <tr key={index}>
                  <td data-invoice-text="table-desc" className="py-4 pr-4">
                    <span className="font-medium text-black">{item.description}</span>
                  </td>
                  <td data-invoice-text="table-qty" className="py-4 text-center text-neutral-500 font-mono">
                    {item.quantity}
                  </td>
                  <td data-invoice-text="table-price" className="py-4 text-right text-neutral-500 font-mono">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td data-invoice-text="table-amount" className="py-4 text-right font-mono font-medium text-black">
                    {formatCurrency(item.lineTotal, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Minimal Totals */}
        <div data-invoice-cat="total" className="flex justify-end pt-4 border-t border-neutral-200">
          <div className="w-64 space-y-2 text-xs">
            <div data-invoice-text="subtotal" className="flex justify-between text-neutral-500">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
              <div data-invoice-text="discount" className="flex justify-between text-neutral-500">
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
              <div data-invoice-text="tax" className="flex justify-between text-neutral-500">
                <span>Tax ({taxRate}%)</span>
                <span className="font-mono">+{formatCurrency(taxTotal, currency)}</span>
              </div>
            )}
            <div data-invoice-text="grand-total" className="flex justify-between py-2 border-t border-black font-semibold text-sm text-black">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total, currency)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between text-neutral-500 text-xs">
                  <span>Paid</span>
                  <span className="font-mono">-{formatCurrency(amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold text-black">
                  <span>Due</span>
                  <span className="font-mono">{formatCurrency(balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Payment & Notes */}
        {(business.bankDetails || notes || paymentTerms) && (
          <div data-invoice-cat="total" className="mt-12 pt-6 border-t border-neutral-100 text-[11px] text-neutral-500 space-y-2">
            {paymentTerms && <div data-invoice-text="payment-terms">Payment Terms: {paymentTerms}</div>}
            {business.bankDetails && (
              <div data-invoice-text="bank-details" className="font-mono whitespace-pre-line text-[10px]">
                {business.bankDetails}
              </div>
            )}
            {notes && <div data-invoice-text="notes" className="italic">{notes}</div>}
          </div>
        )}
      </div>

      <div className="pt-12 text-[10px] text-neutral-400 font-mono text-center">
        {business.website || business.email || ""}
      </div>
    </div>
  );
};
