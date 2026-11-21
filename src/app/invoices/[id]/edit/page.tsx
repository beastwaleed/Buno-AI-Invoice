import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [invoice, customers, profile] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id, userId: user.id },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        payments: true,
      },
    }),
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.businessProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  const formattedInvoice: any = {
    ...invoice,
    invoiceDate: invoice.invoiceDate.toISOString().split("T")[0],
    dueDate: invoice.dueDate.toISOString().split("T")[0],
    business: profile || {
      businessName: "My Business",
      email: "billing@example.com",
    },
  };

  return (
    <AppShell
      user={user}
      title={`Editing ${invoice.invoiceNumber}`}
      subtitle="Update line items, recalculate totals, change templates, and export."
    >
      <InvoiceEditor
        initialInvoice={formattedInvoice}
        customers={customers}
        businessProfile={profile}
        isNew={false}
      />
    </AppShell>
  );
}
