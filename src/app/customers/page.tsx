import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CustomerManagementClient } from "@/components/customer/CustomerManagementClient";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const customers = await prisma.customer.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { invoices: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell
      user={user}
      title="Customer Directory"
      subtitle="Manage your clients, company tax details, and view past billing activity."
    >
      <CustomerManagementClient initialCustomers={customers} />
    </AppShell>
  );
}
