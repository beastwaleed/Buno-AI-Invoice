import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parsePromptToInvoice,
  improveDescription,
  generatePaymentReminder,
} from "@/lib/gemini";
import { produceKafkaEvent, KAFKA_TOPICS } from "@/lib/kafka";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Feature 1: Prompt-to-Invoice
    if (action === "parse-prompt") {
      const { prompt, currency } = body;
      if (!prompt || typeof prompt !== "string") {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
      }

      const parsed = await parsePromptToInvoice(
        prompt,
        currency || user.profile?.defaultCurrency || "USD"
      );

      // Auto-create customer in the database if customer name is provided
      let customerRecord = null;
      if (parsed.customerName && parsed.customerName.trim()) {
        const trimmedName = parsed.customerName.trim();
        customerRecord = await prisma.customer.findFirst({
          where: {
            userId: user.id,
            name: { equals: trimmedName, mode: "insensitive" },
          },
        });

        if (!customerRecord) {
          customerRecord = await prisma.customer.create({
            data: {
              userId: user.id,
              name: trimmedName,
              email: parsed.customerEmail?.trim() || null,
              address: parsed.customerAddress?.trim() || null,
            },
          });

          // Publish customer.created event to Kafka message bus
          await produceKafkaEvent(KAFKA_TOPICS.CUSTOMER_CREATED, customerRecord, customerRecord.id);
        }
      }

      // Publish AI invoice generated event to Kafka
      await produceKafkaEvent(KAFKA_TOPICS.AI_INVOICE_GENERATED, {
        parsed,
        customer: customerRecord,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        data: parsed,
        customer: customerRecord,
      });
    }

    // Feature 2: Improve Line Item Description
    if (action === "improve-description") {
      const { description } = body;
      if (!description) {
        return NextResponse.json({ error: "Description is required" }, { status: 400 });
      }

      const improved = await improveDescription(description);
      return NextResponse.json({ success: true, improved });
    }

    // Feature 3: Payment Reminder Writing
    if (action === "generate-reminder") {
      const { tone = "polite", invoiceData } = body;
      if (!invoiceData) {
        return NextResponse.json({ error: "Invoice data is required" }, { status: 400 });
      }

      const reminderText = await generatePaymentReminder(tone, invoiceData);
      return NextResponse.json({ success: true, reminder: reminderText });
    }

    // Feature 4: Invoice Insights
    if (action === "generate-insights") {
      // Fetch user's real invoice statistics from database
      const invoices = await prisma.invoice.findMany({
        where: { userId: user.id },
        include: { customer: true },
      });

      const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total, 0);
      const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
      const totalOutstanding = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);
      const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
      const paidInvoices = invoices.filter((inv) => inv.status === "paid");

      const topClients = Object.values(
        invoices.reduce((acc: any, inv) => {
          const name = inv.customer?.name || "Other";
          if (!acc[name]) acc[name] = { name, total: 0, count: 0 };
          acc[name].total += inv.total;
          acc[name].count += 1;
          return acc;
        }, {})
      ).sort((a: any, b: any) => b.total - a.total);

      const insights = {
        totalInvoices: invoices.length,
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        overdueCount: overdueInvoices.length,
        paidCount: paidInvoices.length,
        collectionRate:
          totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100,
        topClients: topClients.slice(0, 3),
        summaryNote:
          totalOutstanding > 0
            ? `You have ${invoices.length} total invoices with a ${
                totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 100
              }% collection rate. There is ${totalOutstanding.toFixed(
                2
              )} outstanding across active accounts.`
            : "All invoiced accounts are fully settled. Excellent billing health!",
      };

      return NextResponse.json({ success: true, insights });
    }

    return NextResponse.json({ error: "Unknown AI action" }, { status: 400 });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 });
  }
}
