"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "@/app/page";

interface DateFilterProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
}

export function DateFilter({ value, onValueChange }: DateFilterProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a date range" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="month">This Month</SelectItem>
        <SelectItem value="week">This Week</SelectItem>
      </SelectContent>
    </Select>
  );
}
