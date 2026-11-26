import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateInvoiceTotals, calculateLineTotal } from "@/lib/calculations";
import { produceKafkaEvent, KAFKA_TOPICS } from "@/lib/kafka";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sort") || "date-desc";

    const whereClause: any = {
      userId: user.id,
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { companyName: { contains: search } } },
      ];
    }

    let orderBy: any = { invoiceDate: "desc" };
    if (sortBy === "date-asc") orderBy = { invoiceDate: "asc" };
    else if (sortBy === "amount-desc") orderBy = { total: "desc" };
    else if (sortBy === "amount-asc") orderBy = { total: "asc" };
    else if (sortBy === "number-desc") orderBy = { invoiceNumber: "desc" };

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: "asc" },
        },
        payments: true,
      },
      orderBy,
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      customerId,
      invoiceNumber,
      templateId = "classic",
      status = "draft",
      invoiceDate = new Date(),
      dueDate,
      currency = "USD",
      discount = 0,
      discountType = "percentage",
      taxRate = 0,
      amountPaid = 0,
      notes = "",
      paymentTerms = "",
      items = [],
      fontSizeConfig,
      tableConfig,
    } = body;

    // Process Items with deterministic calculations
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

    // Recalculate totals deterministically
    const totals = calculateInvoiceTotals(
      processedItems,
      parseFloat(discount) || 0,
      discountType,
      parseFloat(taxRate) || 0,
      parseFloat(amountPaid) || 0
    );

    // Fetch user business profile for snapshot
    const profile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    let customerSnapshot: any = null;
    if (customerId) {
      const cust = await prisma.customer.findUnique({
        where: { id: customerId, userId: user.id },
      });
      if (cust) customerSnapshot = cust;
    }

    const finalInvoiceNumber =
      invoiceNumber ||
      `${profile?.invoicePrefix || "INV-"}${profile?.nextInvoiceNumber || 1001}`;

    const newInvoice = await prisma.invoice.create({
      data: {
        userId: user.id,
        customerId: customerId || null,
        invoiceNumber: finalInvoiceNumber,
        templateId,
        status,
        invoiceDate: new Date(invoiceDate),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
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
        businessSnapshot: profile
          ? JSON.stringify({ ...profile, fontSizeConfig, tableConfig })
          : fontSizeConfig || tableConfig
          ? JSON.stringify({ fontSizeConfig, tableConfig })
          : null,
        customerSnapshot: customerSnapshot ? JSON.stringify(customerSnapshot) : null,
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

    // Increment next invoice number if profile exists
    if (profile) {
      await prisma.businessProfile.update({
        where: { userId: user.id },
        data: {
          nextInvoiceNumber: (profile.nextInvoiceNumber || 1000) + 1,
        },
      });
    }

    // Publish invoice.created event to Kafka
    await produceKafkaEvent(KAFKA_TOPICS.INVOICE_CREATED, newInvoice, newInvoice.id);

    return NextResponse.json({ success: true, invoice: newInvoice });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
