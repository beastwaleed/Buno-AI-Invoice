import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const source = await prisma.invoice.findUnique({
      where: { id: params.id, userId: user.id },
      include: {
        items: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source invoice not found" }, { status: 404 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    const newInvoiceNumber = `${profile?.invoicePrefix || "INV-"}${profile?.nextInvoiceNumber || 1001}`;

    const duplicated = await prisma.invoice.create({
      data: {
        userId: user.id,
        customerId: source.customerId,
        invoiceNumber: newInvoiceNumber,
        templateId: source.templateId,
        status: "draft",
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currency: source.currency,
        subtotal: source.subtotal,
        discount: source.discount,
        discountType: source.discountType,
        taxRate: source.taxRate,
        taxTotal: source.taxTotal,
        total: source.total,
        amountPaid: 0,
        balanceDue: source.total,
        notes: source.notes,
        paymentTerms: source.paymentTerms,
        businessSnapshot: source.businessSnapshot,
        customerSnapshot: source.customerSnapshot,
        items: {
          create: source.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            lineTotal: item.lineTotal,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    if (profile) {
      await prisma.businessProfile.update({
        where: { userId: user.id },
        data: { nextInvoiceNumber: (profile.nextInvoiceNumber || 1000) + 1 },
      });
    }

    return NextResponse.json({ success: true, invoice: duplicated });
  } catch (error) {
    console.error("Duplicate invoice error:", error);
    return NextResponse.json({ error: "Failed to duplicate invoice" }, { status: 500 });
  }
}
