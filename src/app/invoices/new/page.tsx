import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { InvoiceEditor } from "@/components/invoice/InvoiceEditor";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams?: { mode?: string; template?: string };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [customers, profile] = await Promise.all([
    prisma.customer.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    }),
    prisma.businessProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  return (
    <AppShell
      user={user}
      title="Create New Invoice"
      subtitle="Craft studio-quality invoices with real-time preview and instant PDF/image export."
    >
      <InvoiceEditor
        customers={customers}
        businessProfile={profile}
        isNew={true}
        initialTemplate={searchParams?.template}
        initialMode={searchParams?.mode}
      />
    </AppShell>
  );
}
