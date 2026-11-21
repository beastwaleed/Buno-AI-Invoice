"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  FileEdit,
  Copy,
  Trash2,
  DollarSign,
  Sparkles,
  Download,
  Printer,
  ChevronDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToPdf, exportToPng, exportToJpeg, triggerPrint } from "@/lib/export";

interface InvoiceListClientProps {
  initialInvoices: any[];
}

export const InvoiceListClient: React.FC<InvoiceListClientProps> = ({
  initialInvoices,
}) => {
  const router = useRouter();
  const [invoices, setInvoices] = useState<any[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  // Payment Recording Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // AI Reminder Modal
  const [aiReminderModalOpen, setAiReminderModalOpen] = useState(false);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<any>(null);
  const [reminderTone, setReminderTone] = useState<"polite" | "whatsapp" | "friendly" | "firm">("polite");
  const [generatedReminder, setGeneratedReminder] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);

  // Filter & Sort logic
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer?.companyName || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc")
        return new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime();
      if (sortBy === "date-asc")
        return new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime();
      if (sortBy === "amount-desc") return b.total - a.total;
      if (sortBy === "amount-asc") return a.total - b.total;
      return 0;
    });

  // Duplicate Invoice
  const handleDuplicate = async (id: string) => {
    const tId = toast.loading("Duplicating invoice...");
    try {
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice duplicated!", { id: tId });
        setInvoices([data.invoice, ...invoices]);
        router.refresh();
      } else {
        toast.error("Failed to duplicate invoice", { id: tId });
      }
    } catch {
      toast.error("Error duplicating invoice", { id: tId });
    }
  };

  // Delete Invoice
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    const tId = toast.loading("Deleting invoice...");
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Invoice deleted", { id: tId });
        setInvoices(invoices.filter((i) => i.id !== id));
      } else {
        toast.error("Failed to delete invoice", { id: tId });
      }
    } catch {
      toast.error("Error deleting invoice", { id: tId });
    }
  };

  // Record Payment
  const handleRecordPayment = async () => {
    if (!selectedInvoiceForPayment) return;
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setIsRecordingPayment(true);
    const tId = toast.loading("Recording payment...");

    try {
      const res = await fetch(`/api/invoices/${selectedInvoiceForPayment.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethod,
          reference: paymentRef,
          notes: paymentNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Payment recorded successfully!", { id: tId });
        setInvoices(
          invoices.map((inv) =>
            inv.id === selectedInvoiceForPayment.id ? data.invoice : inv
          )
        );
        setPaymentModalOpen(false);
        setPaymentAmount("");
        setPaymentRef("");
        setPaymentNotes("");
      } else {
        toast.error(data.error || "Failed to record payment", { id: tId });
      }
    } catch {
      toast.error("Error recording payment", { id: tId });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // AI Reminder generator
  const handleGenerateAiReminder = async (toneToUse?: "polite" | "whatsapp" | "friendly" | "firm") => {
    if (!selectedInvoiceForReminder) return;
    const tone = toneToUse || reminderTone;

    setReminderLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-reminder",
          tone,
          invoiceData: {
            invoiceNumber: selectedInvoiceForReminder.invoiceNumber,
            customerName: selectedInvoiceForReminder.customer?.name || "Client",
            totalFormatted: formatCurrency(
              selectedInvoiceForReminder.balanceDue || selectedInvoiceForReminder.total,
              selectedInvoiceForReminder.currency
            ),
            dueDateFormatted: formatDate(selectedInvoiceForReminder.dueDate),
            businessName: "Our Accounts Team",
          },
        }),
      });

      const data = await res.json();
      if (data.reminder) {
        setGeneratedReminder(data.reminder);
      }
    } catch {
      toast.error("Failed to generate reminder draft");
    } finally {
      setReminderLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filter, Sort, New Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E8E8E5] shadow-subtle">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice # or client..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="hidden md:flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Total</option>
              <option value="amount-asc">Lowest Total</option>
            </select>
          </div>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4468E8] hover:bg-[#3455D1] text-white rounded-lg text-xs font-medium shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Invoice</span>
        </Link>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-[#E8E8E5] shadow-subtle overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FAFAF8] border border-[#E8E8E5] flex items-center justify-center mx-auto text-[#70757A] mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#202124]">
              No invoices match your criteria
            </h3>
            <p className="text-xs text-[#70757A] mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or filters, or create a new invoice to get started.
            </p>
            <div className="mt-4">
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#4468E8] text-white rounded-lg text-xs font-medium hover:bg-[#3455D1]"
              >
                <Plus className="w-3.5 h-3.5" /> Create Invoice
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E8E8E5] bg-[#FAFAF8] text-[11px] font-semibold text-[#70757A] uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EE]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAFAF8] transition-colors group">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#202124]">
                      <Link
                        href={`/invoices/${inv.id}/edit`}
                        className="hover:text-[#4468E8]"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#202124]">
                        {inv.customer?.name || "Unassigned"}
                      </div>
                      {inv.customer?.companyName && (
                        <div className="text-[10px] text-[#70757A]">
                          {inv.customer.companyName}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#70757A]">
                      {formatDate(inv.invoiceDate)}
                    </td>

                    <td className="py-3.5 px-4 text-[#70757A]">
                      {formatDate(inv.dueDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                          inv.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : inv.status === "partially_paid"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                            : inv.status === "overdue"
                            ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                            : inv.status === "sent"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/50"
                            : "bg-slate-100 text-slate-700 border border-slate-200/50"
                        }`}
                      >
                        {inv.status.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-[#202124]">
                      {formatCurrency(inv.total, inv.currency)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#202124]">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-700">
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-normal">Paid</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.balanceDue > 0 && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv);
                                setPaymentAmount(inv.balanceDue.toString());
                                setPaymentModalOpen(true);
                              }}
                              title="Record Payment"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceForReminder(inv);
                                setAiReminderModalOpen(true);
                                handleGenerateAiReminder("polite");
                              }}
                              title="AI Payment Reminder"
                              className="p-1.5 text-[#4468E8] hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        <Link
                          href={`/invoices/${inv.id}/edit`}
                          title="Edit Invoice"
                          className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded-lg transition-colors"
                        >
                          <FileEdit className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(inv.id)}
                          title="Duplicate Invoice"
                          className="p-1.5 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          title="Delete Invoice"
                          className="p-1.5 text-[#70757A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-elevated border border-[#E8E8E5] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  Record Payment for {selectedInvoiceForPayment.invoiceNumber}
                </h3>
                <p className="text-xs text-[#70757A]">
                  Outstanding balance:{" "}
                  <span className="font-mono font-bold text-[#202124]">
                    {formatCurrency(
                      selectedInvoiceForPayment.balanceDue,
                      selectedInvoiceForPayment.currency
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Payment Amount ({selectedInvoiceForPayment.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] font-mono"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] bg-white"
                >
                  <option value="Bank Transfer">Bank Wire / ACH</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="PayPal">PayPal</option>
                  <option value="Cash">Cash</option>
                  <option value="Check">Check</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5] font-mono"
                  placeholder="e.g. WIRE-99821 or TX-4401"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#202124] mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E8E8E5]"
                  placeholder="e.g. 50% deposit received via wire"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#70757A] hover:bg-[#F5F5F3] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={isRecordingPayment}
                className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                {isRecordingPayment ? "Recording..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Payment Reminder Modal */}
      {aiReminderModalOpen && selectedInvoiceForReminder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-[#E8E8E5] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4468E8] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#202124]">
                  AI Payment Reminder Generator
                </h3>
                <p className="text-xs text-[#70757A]">
                  For {selectedInvoiceForReminder.invoiceNumber} (
                  {selectedInvoiceForReminder.customer?.name})
                </p>
              </div>
            </div>

            {/* Tone Selector */}
            <div className="flex gap-2">
              {(["polite", "whatsapp", "friendly", "firm"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setReminderTone(t);
                    handleGenerateAiReminder(t);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                    reminderTone === t
                      ? "bg-[#4468E8] text-white border-[#4468E8]"
                      : "bg-[#FAFAF8] text-[#70757A] border-[#E8E8E5] hover:bg-slate-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Generated Message Display */}
            <div>
              <label className="block text-xs font-medium text-[#202124] mb-1">
                Drafted Message
              </label>
              <textarea
                rows={6}
                value={reminderLoading ? "Generating draft with Buno AI..." : generatedReminder}
                onChange={(e) => setGeneratedReminder(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#E8E8E5] bg-[#FAFAF8] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedReminder);
                  toast.success("Draft copied to clipboard!");
                }}
                className="text-xs font-medium text-[#4468E8] hover:underline"
              >
                Copy to Clipboard
              </button>

              <button
                type="button"
                onClick={() => setAiReminderModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#202124] bg-[#F5F5F3] hover:bg-[#E8E8E5] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
