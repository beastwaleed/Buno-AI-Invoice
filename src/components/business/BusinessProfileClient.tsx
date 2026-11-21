"use client";

import React, { useState } from "react";
import {
  Building2,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Globe,
  Mail,
  Phone,
  MapPin,
  Crop as CropIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ImageCropModal } from "@/components/common/ImageCropModal";
import { CURRENCIES } from "@/lib/currencies";

interface BusinessProfileClientProps {
  initialProfile: any;
}

export const BusinessProfileClient: React.FC<BusinessProfileClientProps> = ({
  initialProfile,
}) => {
  const [profile, setProfile] = useState(
    initialProfile || {
      businessName: "My Business",
      ownerName: "",
      logoUrl: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      taxNumber: "",
      registrationNumber: "",
      bankDetails: "",
      paymentInstructions: "",
      defaultCurrency: "USD",
      defaultTaxRate: 0,
      defaultPaymentTerms: "Net 14 Days",
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1001,
    }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string>("");

  // When a user selects a file, read it and open the Crop Modal
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Logo file size must be less than 10MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageForCrop(objectUrl);
    setCropModalOpen(true);
    e.target.value = "";
  };

  // Re-crop existing logo
  const handleReCrop = () => {
    if (!profile.logoUrl) return;
    setSelectedImageForCrop(profile.logoUrl);
    setCropModalOpen(true);
  };

  // Upload cropped file to Cloudinary and update business profile
  const handleApplyCroppedLogo = async (croppedFile: File) => {
    setIsUploadingLogo(true);
    const uploadToast = toast.loading("Uploading cropped logo to cloud...");

    try {
      const formData = new FormData();
      formData.append("file", croppedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        const newLogoUrl = data.url;
        setProfile((prev: any) => {
          const updated = { ...prev, logoUrl: newLogoUrl };
          fetch("/api/business-profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        });

        toast.success("Logo cropped, framed, and saved!", { id: uploadToast });
      } else {
        toast.error(data.error || "Failed to upload logo", { id: uploadToast });
      }
    } catch {
      toast.error("Upload failed. Please try again.", { id: uploadToast });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setProfile((prev: any) => {
      const updated = { ...prev, logoUrl: "" };
      fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
    toast.success("Logo removed");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const saveToast = toast.loading("Saving business profile...");

    try {
      const res = await fetch("/api/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Business profile saved persistently!", { id: saveToast });
      } else {
        toast.error(data.error || "Failed to save profile", { id: saveToast });
      }
    } catch {
      toast.error("Failed to save profile", { id: saveToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Identity & Logo */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#70757A] pb-2 border-b border-[#F0F0EE]">
            Company Identity & Branding
          </h3>

          {/* Logo Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#FAFAF8] flex items-center justify-center relative overflow-hidden shrink-0">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt="Logo preview"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Building2 className="w-8 h-8 text-[#A0A5AA]" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E8E8E5] transition-colors cursor-pointer ${
                    isUploadingLogo
                      ? "bg-[#FAFAF8] text-[#9CA3AF] pointer-events-none"
                      : "text-[#202124] bg-white hover:bg-[#F5F5F3]"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#4468E8]" />
                  <span>
                    {isUploadingLogo
                      ? "Uploading..."
                      : profile.logoUrl
                      ? "Upload New Logo"
                      : "Upload Logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelect}
                    disabled={isUploadingLogo}
                    className="hidden"
                  />
                </label>

                {profile.logoUrl && (
                  <>
                    <button
                      type="button"
                      onClick={handleReCrop}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4468E8] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                      title="Crop or reframe existing logo"
                    >
                      <CropIcon className="w-3.5 h-3.5" />
                      <span>Crop & Frame</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#70757A]">
                Supports 1:1 Square, 16:9 Banner, 4:3, 3:2, and Freeform crop ratios with zoom and rotate controls.
              </p>
            </div>
          </div>

          {/* Name & Owner Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.businessName}
                onChange={(e) =>
                  setProfile({ ...profile, businessName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                placeholder="e.g. Wright & Associates Design Studio"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Owner / Representative Name
              </label>
              <input
                type="text"
                value={profile.ownerName || ""}
                onChange={(e) =>
                  setProfile({ ...profile, ownerName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
                placeholder="e.g. Alexander Wright"
              />
            </div>
          </div>
        </div>

        {/* 2. Contact Information */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#70757A] pb-2 border-b border-[#F0F0EE]">
            Contact & Legal Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Billing Email
              </label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                placeholder="billing@company.com"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Business Phone
              </label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Website
              </label>
              <input
                type="text"
                value={profile.website || ""}
                onChange={(e) =>
                  setProfile({ ...profile, website: e.target.value })
                }
                placeholder="https://company.com"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#202124] mb-1">
              Physical / Registered Address
            </label>
            <textarea
              rows={2}
              value={profile.address || ""}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
              placeholder="Street address, Suite, City, State, ZIP, Country"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Tax ID / VAT Registration
              </label>
              <input
                type="text"
                value={profile.taxNumber || ""}
                onChange={(e) =>
                  setProfile({ ...profile, taxNumber: e.target.value })
                }
                placeholder="e.g. US-84-9382104 or GB-12345678"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Company Registration #
              </label>
              <input
                type="text"
                value={profile.registrationNumber || ""}
                onChange={(e) =>
                  setProfile({ ...profile, registrationNumber: e.target.value })
                }
                placeholder="e.g. REG-2024-9981"
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
              />
            </div>
          </div>
        </div>

        {/* 3. Banking & Payment Instructions */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#70757A] pb-2 border-b border-[#F0F0EE]">
            Settlement & Bank Wire Details
          </h3>

          <div>
            <label className="block font-medium text-[#202124] mb-1">
              Bank Account & Wire Instructions
            </label>
            <textarea
              rows={3}
              value={profile.bankDetails || ""}
              onChange={(e) =>
                setProfile({ ...profile, bankDetails: e.target.value })
              }
              placeholder="Bank Name: Silicon Valley Bank&#10;Account No: 1234-5678-9012&#10;Routing/ABA: 121000358&#10;SWIFT/BIC: SVBUS6S"
              className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            />
          </div>

          <div>
            <label className="block font-medium text-[#202124] mb-1">
              Payment Terms & Notes
            </label>
            <input
              type="text"
              value={profile.paymentInstructions || ""}
              onChange={(e) =>
                setProfile({ ...profile, paymentInstructions: e.target.value })
              }
              placeholder="Please quote invoice number on wire. Payments due within terms."
              className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20"
            />
          </div>
        </div>

        {/* 4. Invoice Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-4 text-xs">
          <h3 className="font-semibold uppercase tracking-wider text-[#70757A] pb-2 border-b border-[#F0F0EE]">
            Default Invoice Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Default Currency
              </label>
              <select
                value={profile.defaultCurrency}
                onChange={(e) =>
                  setProfile({ ...profile, defaultCurrency: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] bg-white font-medium"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol}) — {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Default Tax (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={profile.defaultTaxRate}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    defaultTaxRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={profile.invoicePrefix}
                onChange={(e) =>
                  setProfile({ ...profile, invoicePrefix: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono"
                placeholder="INV-"
              />
            </div>

            <div>
              <label className="block font-medium text-[#202124] mb-1">
                Next Invoice #
              </label>
              <input
                type="number"
                value={profile.nextInvoiceNumber}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    nextInvoiceNumber: parseInt(e.target.value) || 1001,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#E8E8E5] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium text-white bg-[#4468E8] hover:bg-[#3455D1] rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Business Profile"}</span>
          </button>
        </div>
      </form>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={selectedImageForCrop}
        onClose={() => setCropModalOpen(false)}
        onApplyCrop={handleApplyCroppedLogo}
        title="Crop & Frame Business Logo"
      />
    </>
  );
};
