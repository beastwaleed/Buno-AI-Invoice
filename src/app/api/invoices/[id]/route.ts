import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/calculations";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id, userId: user.id },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      invoiceNumber,
      templateId,
      status,
      invoiceDate,
      dueDate,
      currency,
      discount,
      discountType,
      taxRate,
      amountPaid,
      notes,
      paymentTerms,
      items = [],
      fontSizeConfig,
      tableConfig,
    } = body;

    // Recalculate deterministic line totals
    const processedItems = items.map((item: any, idx: number) => ({
      description: item.description || "Item",
      quantity: Math.max(0, parseFloat(item.quantity) || 1),
      unit: item.unit || "unit",
      unitPrice: Math.max(0, parseFloat(item.unitPrice) || 0),
      discount: Math.max(0, parseFloat(item.discount) || 0),
      taxRate: Math.max(0, parseFloat(item.taxRate) || 0),
      lineTotal: calculateLineTotal(item),
      sortOrder: idx + 1,
    }));

    const totals = calculateInvoiceTotals(
      processedItems,
      parseFloat(discount) || 0,
      discountType || "percentage",
      parseFloat(taxRate) || 0,
      parseFloat(amountPaid) || 0
    );

    // Update using transaction: delete old items and recreate with new totals
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      const existing = await tx.invoice.findUnique({
        where: { id: params.id },
        select: { businessSnapshot: true },
      });
      let snap: any = {};
      try {
        if (existing?.businessSnapshot) snap = JSON.parse(existing.businessSnapshot);
      } catch {}
      if (fontSizeConfig) snap.fontSizeConfig = fontSizeConfig;
      if (tableConfig) snap.tableConfig = tableConfig;
      if (body.removeLogoBackground !== undefined) snap.removeLogoBackground = body.removeLogoBackground;
      if (body.transparentLogoUrl !== undefined) snap.transparentLogoUrl = body.transparentLogoUrl;
      if (body.originalLogoUrl !== undefined) snap.originalLogoUrl = body.originalLogoUrl;

      return tx.invoice.update({
        where: { id: params.id, userId: user.id },
        data: {
          customerId: customerId || null,
          invoiceNumber,
          templateId,
          status,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          currency,
          subtotal: totals.subtotal,
          discount: parseFloat(discount) || 0,
          discountType,
          taxRate: parseFloat(taxRate) || 0,
          taxTotal: totals.taxTotal,
          total: totals.grandTotal,
          amountPaid: parseFloat(amountPaid) || 0,
          balanceDue: totals.balanceDue,
          notes,
          paymentTerms,
          businessSnapshot: JSON.stringify(snap),
          items: {
            create: processedItems,
          },
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      });
    });

    return NextResponse.json({ success: true, invoice: updatedInvoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.invoice.delete({
      where: { id: params.id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
