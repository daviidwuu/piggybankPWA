import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/data";
import { ChartConfig } from "../ui/chart";
import { format } from 'date-fns';
import { Button } from "../ui/button";
import { ChevronDown, ArrowUpDown } from "lucide-react";
import { SortOption } from "@/app/dashboard";

interface TransactionsTableProps {
  data: Transaction[];
  chartConfig: ChartConfig;
  hasMore: boolean;
  onLoadMore: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
}

export function TransactionsTable({ data, chartConfig, hasMore, onLoadMore, sortOption, onSortChange }: TransactionsTableProps) {
  const formatDate = (dateString: string | null) => {
    if (dateString === null) {
        return { date: 'Invalid', time: 'Date' };
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { date: 'Invalid', time: 'Date' };
    }
    return {
        date: format(date, 'dd/MM'),
        time: format(date, 'HH:mm'),
    };
  };

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: "Latest", value: "latest" },
    { label: "Highest Amount", value: "highest" },
    { label: "Category", value: "category" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your most recent financial activities.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => onSortChange(option.value)}
                  className={sortOption === option.value ? "bg-accent" : ""}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-6 pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] p-2 pl-0">Date</TableHead>
              <TableHead className="w-[90px] text-right p-2">Amount</TableHead>
              <TableHead className="p-2 pr-0">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => {
                const { date, time } = formatDate(transaction.Date);
                return (
                  <TableRow key={transaction.ID}>
                    <TableCell className="font-medium text-xs p-2 pl-0">
                        <div>{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm p-2">
                      ${transaction.Amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-2 pr-0">
                      <div className="flex items-center gap-2">
                         <Badge
                          className="whitespace-nowrap px-1.5 py-0 text-[10px] font-semibold"
                           style={{
                            backgroundColor: chartConfig[transaction.Category]?.color ? `${chartConfig[transaction.Category]?.color}20` : '#88888820', // 12.5% opacity
                            color: chartConfig[transaction.Category]?.color || '#888888',
                            borderColor: chartConfig[transaction.Category]?.color || '#888888',
                            borderWidth: '1px',
                          }}
                        >
                          {transaction.Category}
                        </Badge>
                        <span className="font-medium truncate block max-w-[150px]">{transaction.Notes}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
            })}
          </TableBody>
        </Table>
        {hasMore && (
          <div className="p-0 pt-1 flex justify-center">
            <Button
              variant="ghost"
              onClick={onLoadMore}
              className="w-full h-auto p-1 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
