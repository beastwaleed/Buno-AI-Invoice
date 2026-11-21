import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import {
  User,
  Building2,
  Palette,
  FileCheck,
  Shield,
  Key,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <AppShell
      user={user}
      title="Application & Account Settings"
      subtitle="Configure preferences, invoice defaults, and account credentials."
    >
      <div className="max-w-3xl space-y-6">
        {/* User Account Info */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-[#F0F0EE]">
            <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] border border-[#E8E8E5] flex items-center justify-center text-[#4468E8]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#202124]">
                Account Profile
              </h3>
              <p className="text-xs text-[#70757A]">
                Account Overview & Preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#70757A] block">Full Name</span>
              <span className="font-semibold text-[#202124] text-sm">{user.name}</span>
            </div>
            <div>
              <span className="text-[#70757A] block">Email Address</span>
              <span className="font-medium text-[#202124] text-xs">{user.email}</span>
            </div>
            <div>
              <span className="text-[#70757A] block">Account ID</span>
              <span className="font-mono text-[11px] text-[#70757A]">{user.id}</span>
            </div>
          </div>
        </div>

        {/* Invoice & Brand Shortcuts */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
          <h3 className="font-serif font-bold text-base text-[#202124] pb-2 border-b border-[#F0F0EE]">
            Configuration Direct Links
          </h3>

          <div className="space-y-2">
            <Link
              href="/business"
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E8E5] hover:bg-[#FAFAF8] hover:border-blue-200 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[#4468E8]" />
                <div>
                  <span className="font-semibold text-[#202124] block">
                    Business Profile & Logo
                  </span>
                  <span className="text-[#70757A] text-[11px]">
                    Manage company name, address, tax ID, and banking details.
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#70757A]" />
            </Link>

            <Link
              href="/templates"
              className="flex items-center justify-between p-3.5 rounded-xl border border-[#E8E8E5] hover:bg-[#FAFAF8] hover:border-blue-200 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-[#4468E8]" />
                <div>
                  <span className="font-semibold text-[#202124] block">
                    Invoice Template Library (11 Available)
                  </span>
                  <span className="text-[#70757A] text-[11px]">
                    Explore 11 authentic design systems crafted for consulting, studios, agency brands, and enterprise.
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#70757A]" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
