"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { type Transaction } from "@/lib/data";


export type DateRange = 'daily' | 'week' | 'month' | 'yearly' | 'all';

interface DateFilterProps {
  value: DateRange;
  onValueChange: (value: DateRange) => void;
  transactions: Transaction[];
}

const options: { label: string; value: DateRange }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
  { label: "Yearly", value: "yearly" },
  { label: 'All Time', value: 'all'},
];

export function DateFilter({ value, onValueChange, transactions }: DateFilterProps) {

  const getDisplayDate = (range: DateRange): string => {
    if (!transactions.length && range !== 'all') return "No data";
    
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (range) {
      case 'daily':
        return format(today, 'd MMM');
      case 'week':
        startDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        endDate = endOfWeek(today, { weekStartsOn: 1 }); // Sunday
        return `${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM')}`;
      case 'month':
        // Show current month name
        return format(today, 'MMMM yyyy');
      case 'yearly':
        startDate = subYears(today, 1);
        return `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
      case 'all':
      default:
        if (!transactions.length) return "All Time";
        const oldestDate = transactions.reduce((min, t) => {
            if (!t.Date) return min;
            const current = new Date(t.Date);
            return current < min ? current : min;
        }, new Date());
        const mostRecentDate = transactions.reduce((max, t) => {
            if (!t.Date) return max;
            const current = new Date(t.Date);
            return current > max ? current : max;
        }, new Date(0));
        return `${format(oldestDate, 'd MMM yyyy')} - ${format(mostRecentDate, 'd MMM yyyy')}`;
    }
  };


  return (
    <div className="flex flex-col items-end">
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
      <span className="text-xs text-muted-foreground mt-1 min-w-max">
        {getDisplayDate(value)}
      </span>
    </div>
  );
}
