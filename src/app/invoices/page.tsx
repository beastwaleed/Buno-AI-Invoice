import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceListClient } from "@/components/invoice/InvoiceListClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [invoices, profile, settings] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.businessProfile.findUnique({
      where: { userId: user.id },
    }),
    prisma.userSettings.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const businessCurrency = profile?.defaultCurrency || settings?.currency || "USD";

  return (
    <AppShell
      user={user}
      title="Invoices & History"
      subtitle="Manage, track, duplicate, record payments, and export your invoices."
    >
      <InvoiceListClient
        initialInvoices={invoices}
        businessCurrency={businessCurrency}
        businessProfile={profile}
      />
    </AppShell>
  );
}
