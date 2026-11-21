import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { TemplatesGalleryClient } from "@/components/templates/TemplatesGalleryClient";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [profile] = await Promise.all([
    prisma.businessProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const currentDefault = user.settings?.defaultTemplate || "modern";

  return (
    <AppShell
      user={user}
      title="Invoice Template Library"
      subtitle="Explore 11 authentic design systems crafted for consulting, studios, agency brands, and enterprise."
    >
      <TemplatesGalleryClient
        currentDefault={currentDefault}
        businessProfile={profile}
      />
    </AppShell>
  );
}
