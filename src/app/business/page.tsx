import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { BusinessProfileClient } from "@/components/business/BusinessProfileClient";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const profile = await prisma.businessProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <AppShell
      user={user}
      title="Business Profile & Branding"
      subtitle="Your company information automatically populates new invoices and exported documents."
    >
      <BusinessProfileClient initialProfile={profile} />
    </AppShell>
  );
}
