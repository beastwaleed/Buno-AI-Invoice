import { InvoiceData, InvoiceItemData } from "@/types/invoice";

/**
 * Safely rounds a number to 2 decimal places to prevent floating point inaccuracies.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single line item's total.
 * Line Total = (Quantity * UnitPrice) - Discount
 */
export function calculateLineTotal(item: Partial<InvoiceItemData>): number {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const price = Math.max(0, Number(item.unitPrice) || 0);
  const discount = Math.max(0, Number(item.discount) || 0);

  const rawTotal = qty * price - discount;
  return round2(Math.max(0, rawTotal));
}

/**
 * Recalculates all totals for an invoice deterministically.
 */
export function calculateInvoiceTotals(
  items: InvoiceItemData[],
  invoiceDiscount: number = 0,
  discountType: "percentage" | "fixed" = "percentage",
  taxRate: number = 0,
  amountPaid: number = 0
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxTotal: number;
  grandTotal: number;
  balanceDue: number;
} {
  // 1. Calculate items subtotal
  const subtotal = round2(
    items.reduce((acc, item) => acc + calculateLineTotal(item), 0)
  );

  // 2. Calculate invoice-level discount
  let discountAmount = 0;
  if (discountType === "percentage") {
    const rate = Math.min(100, Math.max(0, invoiceDiscount));
    discountAmount = round2((subtotal * rate) / 100);
  } else {
    discountAmount = round2(Math.min(subtotal, Math.max(0, invoiceDiscount)));
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);

  // 3. Calculate Tax
  const safeTaxRate = Math.max(0, taxRate);
  const taxTotal = round2((afterDiscount * safeTaxRate) / 100);

  // 4. Grand Total
  const grandTotal = round2(afterDiscount + taxTotal);

  // 5. Balance Due
  const safePaid = Math.max(0, amountPaid);
  const balanceDue = round2(Math.max(0, grandTotal - safePaid));

  return {
    subtotal,
    discountAmount,
    taxableAmount: afterDiscount,
    taxTotal,
    grandTotal,
    balanceDue,
  };
}

/**
 * Resolves the computed status of an invoice based on balance due and due date.
 */
export function resolveInvoiceStatus(
  currentStatus: string,
  total: number,
  amountPaid: number,
  dueDateString?: string
): "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled" {
  if (currentStatus === "draft" || currentStatus === "cancelled") {
    return currentStatus as any;
  }

  if (total > 0 && amountPaid >= total) {
    return "paid";
  }

  if (amountPaid > 0 && amountPaid < total) {
    return "partially_paid";
  }

  if (dueDateString) {
    const dueDate = new Date(dueDateString);
    if (!isNaN(dueDate.getTime()) && dueDate < new Date()) {
      return "overdue";
    }
  }

  return "sent";
}
