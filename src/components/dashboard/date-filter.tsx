"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";

export type DateRange = 'all' | 'daily' | 'week' | 'month' | 'yearly';

interface DateFilterProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
}

const options: { label: string; value: DateRange }[] = [
  { label: 'All Time', value: 'all'},
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "yearly" },
];

export function DateFilter({ value, onValueChange }: DateFilterProps) {
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="flex flex-col items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
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
      {selectedOption && (
        <span className="text-xs text-muted-foreground mt-1">{selectedOption.label}</span>
      )}
    </div>
  );
}
