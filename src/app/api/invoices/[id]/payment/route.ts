import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { round2, resolveInvoiceStatus } from "@/lib/calculations";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, paymentMethod = "Bank Transfer", reference = "", notes = "" } = body;

    const paymentAmount = round2(parseFloat(amount) || 0);
    if (paymentAmount <= 0) {
      return NextResponse.json({ error: "Payment amount must be greater than 0" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, userId: user.id },
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Record payment & update invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount: paymentAmount,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
        },
      });

      const newAmountPaid = round2(invoice.amountPaid + paymentAmount);
      const newBalanceDue = round2(Math.max(0, invoice.total - newAmountPaid));
      const newStatus = resolveInvoiceStatus(
        invoice.status,
        invoice.total,
        newAmountPaid,
        invoice.dueDate.toISOString()
      );

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
        include: {
          payments: {
            orderBy: { paymentDate: "desc" },
          },
          customer: true,
          items: true,
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Payment recording error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
