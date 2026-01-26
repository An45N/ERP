import { Input } from "./Input";
import { Button } from "./Button";
import { X } from "lucide-react";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
  label?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  label = "Date Range",
}: DateRangeFilterProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          placeholder="Start date"
          className="flex-1"
        />
        <span className="text-gray-500">to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          placeholder="End date"
          className="flex-1"
        />
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
