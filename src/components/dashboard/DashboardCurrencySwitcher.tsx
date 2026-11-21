"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, getCurrencyDetails } from "@/lib/currencies";
import { Globe, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";

interface DashboardCurrencySwitcherProps {
  currentCurrency: string;
}

export const DashboardCurrencySwitcher: React.FC<DashboardCurrencySwitcherProps> = ({
  currentCurrency,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const current = getCurrencyDetails(currentCurrency);

  const handleSelect = async (code: string) => {
    if (code === currentCurrency) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);
    const toastId = toast.loading(`Updating currency to ${code}...`);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: code }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Dashboard currency set to ${code} (${getCurrencyDetails(code).symbol})`, {
          id: toastId,
        });
        router.refresh();
      } else {
        toast.error("Failed to update currency", { id: toastId });
      }
    } catch {
      toast.error("Failed to update currency preference", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-white hover:bg-[#FAFAF8] border border-[#E8E8E5] text-[#202124] shadow-2xs transition-colors"
        title="Change dashboard billing currency"
      >
        <Globe className="w-3.5 h-3.5 text-[#4468E8]" />
        <span className="font-semibold">{current.code}</span>
        <span className="text-[#70757A]">({current.symbol})</span>
        <ChevronDown className="w-3 h-3 text-[#70757A]" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E8E8E5] shadow-xl z-50 py-2 max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 border-b border-[#F0F0EE] mb-1">
              <span className="text-[10px] font-semibold text-[#70757A] uppercase tracking-wider block">
                Select Dashboard Currency
              </span>
            </div>

            {CURRENCIES.map((curr) => {
              const isSelected = curr.code === currentCurrency;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#FAFAF8] transition-colors ${
                    isSelected ? "bg-[#EEF2FF] text-[#4468E8] font-semibold" : "text-[#202124]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-8 font-mono text-[11px] font-bold text-[#70757A]">
                      {curr.symbol}
                    </span>
                    <div>
                      <div className="leading-tight">{curr.code}</div>
                      <div className="text-[10px] text-[#70757A] leading-tight">
                        {curr.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#4468E8]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
