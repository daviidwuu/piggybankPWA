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
import { format, toDate } from 'date-fns';
import { Button } from "../ui/button";
import { ChevronDown, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { SortOption } from "@/app/dashboard";

interface TransactionsTableProps {
  data: Transaction[];
  chartConfig: ChartConfig;
  hasMore: boolean;
  onLoadMore: () => void;
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

export function TransactionsTable({ 
  data, 
  chartConfig, 
  hasMore, 
  onLoadMore, 
  sortOption, 
  onSortChange,
  onEdit,
  onDelete 
}: TransactionsTableProps) {
  const formatDate = (dateValue: { seconds: number; nanoseconds: number; } | null) => {
    if (dateValue === null) {
        return { date: 'Invalid', time: 'Date' };
    }
    const date = toDate(dateValue.seconds * 1000);
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
              <TableHead className="p-1 pl-0">Date</TableHead>
              <TableHead className="p-1">Description</TableHead>
              <TableHead className="p-1 text-right">Amount</TableHead>
              <TableHead className="p-1 pr-0 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => {
                const { date, time } = formatDate(transaction.Date);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium text-sm p-1 pl-0">
                        <div>{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                    </TableCell>
                    <TableCell className="p-1">
                      <div className="flex items-center gap-2">
                         <Badge
                          className="whitespace-nowrap px-1.5 py-0 font-semibold"
                           style={{
                            backgroundColor: chartConfig[transaction.Category]?.color ? `${chartConfig[transaction.Category]?.color}20` : '#88888820', // 12.5% opacity
                            color: chartConfig[transaction.Category]?.color || '#888888',
                            borderColor: chartConfig[transaction.Category]?.color || '#888888',
                            borderWidth: '1px',
                          }}
                        >
                          {transaction.Category}
                        </Badge>
                        <span className="font-medium truncate block max-w-[100px] text-sm">{transaction.Notes}</span>
                      </div>
                    </TableCell>
                     <TableCell className="font-medium text-sm p-1 pr-0 text-right">
                      <div className="flex items-center justify-end">
                        <span>$</span>
                        <span>{transaction.Amount.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="p-1 pr-0 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => onEdit(transaction)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => onDelete(transaction)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

    