import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Users,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch metrics & recent invoices
  const [invoices, customers, profile] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      include: { customer: true },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.customer.findMany({
      where: { userId: user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.businessProfile.findUnique({
      where: { userId: user.id },
    }),
  ]);

  const currency = profile?.defaultCurrency || "USD";
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const outstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
  const recentInvoices = invoices.slice(0, 6);

  return (
    <AppShell
      user={user}
      title="Financial Dashboard"
      subtitle={`Welcome back, ${user.name}. Overview of your billing performance.`}
    >
      <div className="space-y-8">
        {/* Onboarding Banner for empty accounts */}
        {invoices.length === 0 && (
          <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#4468E8] uppercase tracking-wider mb-2">
                Getting Started
              </span>
              <h2 className="font-serif font-bold text-lg text-[#202124]">
                Create your first studio invoice in 60 seconds
              </h2>
              <p className="text-xs text-[#70757A] mt-1 max-w-xl">
                Choose from 6 designer templates, add your business logo, and let Buno compute tax, discounts, and export crisp PDFs effortlessly.
              </p>
            </div>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4468E8] hover:bg-[#3455D1] text-white rounded-xl text-xs font-medium shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Invoice</span>
            </Link>
          </div>
        )}

        {/* 4 Core Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Invoiced */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block">
                Total Invoiced
              </span>
              <div className="text-2xl font-bold font-mono text-[#202124] mt-1">
                {formatCurrency(totalInvoiced, currency)}
              </div>
              <span className="text-[11px] text-[#70757A] mt-1 block">
                {invoices.length} lifetime bills
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E8E8E5] text-[#202124]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* 2. Amount Paid */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block">
                Amount Collected
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {formatCurrency(totalPaid, currency)}
              </div>
              <span className="text-[11px] text-emerald-700/80 mt-1 block">
                {totalInvoiced > 0
                  ? `${Math.round((totalPaid / totalInvoiced) * 100)}% collection rate`
                  : "0% collected"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* 3. Outstanding */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <div className="text-2xl font-bold font-mono text-[#4468E8] mt-1">
                {formatCurrency(outstanding, currency)}
              </div>
              <span className="text-[11px] text-[#70757A] mt-1 block">
                Pending client settlement
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#4468E8]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* 4. Overdue */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-[#70757A] uppercase tracking-wider block">
                Overdue Invoices
              </span>
              <div className="text-2xl font-bold font-mono text-rose-600 mt-1">
                {overdueInvoices.length}
              </div>
              <span className="text-[11px] text-rose-600/80 mt-1 block">
                Requires payment follow-up
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* AI Financial Health Banner */}
        <div className="bg-[#FAF9F5] p-5 rounded-2xl border border-[#E8E8E0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4468E8] text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#202124]">
                Buno AI Billing Insights
              </h3>
              <p className="text-xs text-[#70757A] mt-0.5">
                {outstanding > 0
                  ? `You have ${formatCurrency(outstanding, currency)} in receivables across ${
                      invoices.filter((i) => i.balanceDue > 0).length
                    } accounts. Use the AI reminder assistant in Invoice History to write polite follow-ups.`
                  : "All client balances are up to date! Great cash-flow management."}
              </p>
            </div>
          </div>

          <Link
            href="/invoices"
            className="text-xs font-medium text-[#4468E8] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Review Overdue Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Split Grid: Recent Invoices (Left) & Quick Actions / Customers (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Recent Invoices Table */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[#F0F0EE]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  Recent Invoices
                </h3>
                <p className="text-xs text-[#70757A]">
                  Latest issued billing statements
                </p>
              </div>
              <Link
                href="/invoices"
                className="text-xs text-[#4468E8] font-medium hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#70757A]">
                No invoices created yet. Start with your first invoice today!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E8E5] text-[11px] font-semibold text-[#70757A] uppercase tracking-wider">
                      <th className="py-2.5 px-2">Invoice #</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0EE]">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-2 font-mono font-medium text-[#202124]">
                          <Link
                            href={`/invoices/${inv.id}/edit`}
                            className="hover:text-[#4468E8]"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-2 font-medium text-[#202124]">
                          {inv.customer?.name || "Direct Client"}
                        </td>
                        <td className="py-3 px-2 text-[#70757A]">
                          {formatDate(inv.invoiceDate)}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              inv.status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : inv.status === "partially_paid"
                                ? "bg-amber-50 text-amber-700"
                                : inv.status === "overdue"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {inv.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-semibold text-[#202124]">
                          {formatCurrency(inv.total, inv.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Customers & Templates Shortcut */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#202124]">
                Fast Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/invoices/new"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] transition-colors text-xs font-medium text-[#202124]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#4468E8]" />
                    Create New Invoice
                  </span>
                  <Plus className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/customers"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] transition-colors text-xs font-medium text-[#202124]"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#4468E8]" />
                    Manage Customers ({customers.length})
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  href="/templates"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAF8] hover:bg-[#EEF2FF] hover:text-[#4468E8] border border-[#E8E8E5] transition-colors text-xs font-medium text-[#202124]"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#4468E8]" />
                    Browse 6 Invoice Styles
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Recent Customers List */}
            <div className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#F0F0EE]">
                <h3 className="font-serif font-bold text-sm text-[#202124]">
                  Key Clients
                </h3>
                <Link
                  href="/customers"
                  className="text-[11px] text-[#4468E8] hover:underline"
                >
                  Manage
                </Link>
              </div>

              {customers.length === 0 ? (
                <div className="text-xs text-[#70757A] py-2">
                  No customers saved yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FAFAF8] text-xs"
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="font-semibold text-[#202124] truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-[#70757A] truncate">
                          {c.companyName || c.email || "Individual"}
                        </div>
                      </div>
                      <Link
                        href={`/invoices/new?customerId=${c.id}`}
                        className="text-[11px] font-medium text-[#4468E8] hover:underline shrink-0"
                      >
                        Bill
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
