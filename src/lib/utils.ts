import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getCurrencySymbol } from "./currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  const code = (currency || "USD").toUpperCase();
  const symbol = getCurrencySymbol(code);
  const formatted = (amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Direct symbol prefix for $, €, £, ₹, ¥, etc.
  if (["$", "€", "£", "₹", "¥", "₺", "₫", "₦"].includes(symbol)) {
    return `${symbol}${formatted}`;
  }
  // Spaced prefix for Rs, AED, SAR, CA$, A$, etc.
  return `${symbol} ${formatted}`;
}
