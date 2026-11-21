"use client";

import React, { useState } from "react";
import { CURRENCIES, getCurrencyDetails } from "@/lib/currencies";
import { Globe, Save, CheckCircle2, Calendar, Palette } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SettingsPreferencesClientProps {
  initialSettings: {
    currency: string;
    dateFormat?: string;
    defaultTemplate?: string;
  };
}

export const SettingsPreferencesClient: React.FC<SettingsPreferencesClientProps> = ({
  initialSettings,
}) => {
  const router = useRouter();
  const [currency, setCurrency] = useState(initialSettings.currency || "USD");
  const [dateFormat, setDateFormat] = useState(
    initialSettings.dateFormat || "YYYY-MM-DD"
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading("Saving billing preferences...");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency,
          dateFormat,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Preferences saved! Active currency: ${currency} (${getCurrencyDetails(currency).symbol})`,
          { id: toastId }
        );
        router.refresh();
      } else {
        toast.error("Failed to save settings", { id: toastId });
      }
    } catch {
      toast.error("Failed to save settings. Please try again.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E8E8E5] shadow-subtle space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EE]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAFAF8] border border-[#E8E8E5] flex items-center justify-center text-[#4468E8]">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#202124]">
              Billing Currency & Regional Defaults
            </h3>
            <p className="text-xs text-[#70757A]">
              Controls your dashboard metrics, financial analytics, and new invoice currency
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
        <div>
          <label className="block font-semibold text-[#202124] mb-1.5">
            Default Billing Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 font-medium"
          >
            {CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.code} ({curr.symbol}) — {curr.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#70757A] mt-1.5">
            Synchronizes across your Financial Dashboard, Business Profile, and AI invoicing generator.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-[#202124] mb-1.5">
            Date Formatting
          </label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-[#E8E8E5] bg-white text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4468E8]/20 font-medium"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO standard)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (UK / International)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US standard)</option>
          </select>
          <p className="text-[11px] text-[#70757A] mt-1.5">
            Controls how invoice dates and due dates are formatted on PDF exports.
          </p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#4468E8] hover:bg-[#3455D1] text-white shadow-xs transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
