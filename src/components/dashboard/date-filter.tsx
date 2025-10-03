"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export type DateRange = 'daily' | 'week' | 'month' | 'yearly' | 'all';

interface DateFilterProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
}

const options: { label: string; value: DateRange }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "yearly" },
  { label: 'All Time', value: 'all'},
];

export function DateFilter({ value, onValueChange }: DateFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onValueChange(option.value)}
            className={value === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
