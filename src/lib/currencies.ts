export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  country: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar", country: "United States" },
  { code: "EUR", symbol: "€", name: "Euro", country: "European Union" },
  { code: "GBP", symbol: "£", name: "British Pound", country: "United Kingdom" },
  { code: "PKR", symbol: "Rs", name: "Pakistani Rupee", country: "Pakistan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", country: "India" },
  { code: "AED", symbol: "AED", name: "UAE Dirham", country: "United Arab Emirates" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", country: "Saudi Arabia" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", country: "Canada" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", country: "Australia" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", country: "Japan" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", country: "Switzerland" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", country: "China" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", country: "Singapore" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", country: "New Zealand" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", country: "Turkey" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", country: "Brazil" },
  { code: "ZAR", symbol: "R", name: "South African Rand", country: "South Africa" },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal", country: "Qatar" },
  { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", country: "Kuwait" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar", country: "Bahrain" },
  { code: "OMR", symbol: "OMR", name: "Omani Rial", country: "Oman" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", country: "Malaysia" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", country: "Indonesia" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", country: "Philippines" },
  { code: "THB", symbol: "฿", name: "Thai Baht", country: "Thailand" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong", country: "Vietnam" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", country: "Nigeria" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound", country: "Egypt" },
];

const CURRENCY_MAP: Record<string, CurrencyOption> = CURRENCIES.reduce(
  (acc, curr) => {
    acc[curr.code] = curr;
    return acc;
  },
  {} as Record<string, CurrencyOption>
);

export function getCurrencyDetails(code: string = "USD"): CurrencyOption {
  const normalized = (code || "USD").toUpperCase();
  return (
    CURRENCY_MAP[normalized] || {
      code: normalized,
      symbol: normalized,
      name: normalized,
      country: "Global",
    }
  );
}

export function getCurrencySymbol(code: string = "USD"): string {
  const details = getCurrencyDetails(code);
  return details.symbol;
}
