"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  User,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerData } from "@/types/invoice";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CustomerManagementClientProps {
  initialCustomers: any[];
}

export const CustomerManagementClient: React.FC<CustomerManagementClientProps> = ({
  initialCustomers,
}) => {
  const queryClient = useQueryClient();

  const { data: customers = initialCustomers } = useQuery<any[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      const d = await res.json();
      return d.customers || [];
    },
    initialData: initialCustomers,
  });

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setTaxNumber("");
    setNotes("");
    setModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setName(c.name || "");
    setCompanyName(c.companyName || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setAddress(c.address || "");
    setTaxNumber(c.taxNumber || "");
    setNotes(c.notes || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsSubmitting(true);
    const method = editingCustomer ? "PUT" : "POST";
    const body: any = {
      name,
      companyName,
      email,
      phone,
      address,
      taxNumber,
      notes,
    };
    if (editingCustomer) body.id = editingCustomer.id;

    try {
      const res = await fetch("/api/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.customer) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        if (editingCustomer) {
          toast.success("Customer details updated!");
        } else {
          toast.success("Customer added successfully!");
        }
        setModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save customer");
      }
    } catch {
      toast.error("Failed to save customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        toast.success("Customer deleted");
      } else {
        toast.error("Failed to delete customer");
      }
    } catch {
      toast.error("Error deleting customer");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Add Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#E8E8E5] shadow-subtle">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, company, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#4468E8] hover:bg-[#3455D1] text-white rounded-lg text-xs font-medium shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customer Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#E8E8E5] text-center shadow-subtle">
          <User className="w-10 h-10 text-[#70757A] mx-auto mb-2 opacity-50" />
          <h3 className="font-serif font-bold text-base text-[#202124]">
            No customers found
          </h3>
          <p className="text-xs text-[#70757A] mt-1">
            Add customers to automatically reuse their billing addresses and contact details on invoices.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-[#4468E8] text-white rounded-lg text-xs font-medium hover:bg-[#3455D1]"
          >
            Add First Customer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-2xl border border-[#E8E8E5] shadow-subtle hover:border-blue-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-[#202124]">{c.name}</h4>
                    {c.companyName && (
                      <p className="text-xs text-[#4468E8] font-medium flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3" />
                        {c.companyName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1 text-[#70757A] hover:text-[#202124] hover:bg-[#F5F5F3] rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-[#70757A] hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-[#70757A]">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-[#A0A5AA]" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-[#A0A5AA]" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                  {c.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#A0A5AA] mt-0.5" />
                      <span className="line-clamp-2">{c.address}</span>
                    </div>
                  )}
                  {c.taxNumber && (
                    <div className="font-mono text-[11px] text-[#202124] pt-1">
                      Tax/VAT: {c.taxNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#F0F0EE] flex items-center justify-between text-xs">
                <span className="text-[#70757A] text-[11px]">
                  {c._count?.invoices || 0} bills issued
                </span>
                <Link
                  href={`/invoices/new?customerId=${c.id}`}
                  className="font-medium text-[#4468E8] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Modal (Add / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-[#E8E8E5] space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif font-bold text-base text-[#202124]">
              {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Contact / Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Elena Fisher"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Horizon Labs Inc."
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@horizon.com"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202124] mb-1">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Suite, City, State, Postal Code, Country"
                  className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Tax / VAT Identification
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="VAT-US-9988210"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202124] mb-1">
                    Internal Notes
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Net 30, requires PO on invoice"
                    className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F0F0EE]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#70757A] hover:bg-[#F5F5F3] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
