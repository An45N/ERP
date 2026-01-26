import { DollarSign } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const currencies = [
  { code: "MUR", name: "Mauritian Rupee", symbol: "Rs" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

export function CurrencySelector({
  value,
  onChange,
  label = "Currency",
  disabled = false,
  className = "",
}: CurrencySelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <DollarSign className="h-4 w-4 text-gray-400" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.name} ({currency.symbol})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export { currencies };
