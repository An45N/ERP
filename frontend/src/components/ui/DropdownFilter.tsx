import { Button } from "./Button";
import { X } from "lucide-react";

interface DropdownFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  placeholder?: string;
}

export function DropdownFilter({
  value,
  onChange,
  options,
  label,
  placeholder = "Select...",
}: DropdownFilterProps) {
  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
