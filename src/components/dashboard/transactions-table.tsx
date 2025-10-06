
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
    <Card className="rounded-[var(--radius)]">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your most recent financial activities.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full bg-primary/10 hover:bg-primary/20" aria-label="Sort transactions">
              <ArrowUpDown className="h-4 w-4 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
              {sortOptions.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        {data.length > 0 ? (
          <>
            <Table>
              <caption className="sr-only">Recent Transactions</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="p-1 pl-0">Date</TableHead>
                  <TableHead scope="col" className="p-1 text-left">Amount</TableHead>
                  <TableHead scope="col" className="p-1">Description</TableHead>
                  <TableHead scope="col" className="p-1 pr-0 text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((transaction) => {
                    const { date, time } = formatDate(transaction.Date);
                    return (
                      <TableRow key={transaction.id} className="hover:bg-transparent">
                        <TableCell className="font-medium text-xs p-1 pl-0">
                            <div>{date}</div>
                            <div className="text-muted-foreground">{time}</div>
                        </TableCell>
                        <TableCell className="font-medium text-sm p-1 text-left">
                          <div className="flex items-center">
                            <span>$</span>
                            <span>{transaction.Amount.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="whitespace-nowrap px-1.5 py-0.5 font-semibold text-xs"
                              style={{
                                backgroundColor: chartConfig[transaction.Category]?.color ? `${chartConfig[transaction.Category]?.color}20` : '#88888820', // 12.5% opacity
                                color: chartConfig[transaction.Category]?.color || '#888888',
                              }}
                            >
                              {transaction.Category}
                            </Badge>
                            <span className="font-medium truncate block max-w-[100px] text-sm">{transaction.Notes}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-1 pr-0 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent" aria-label={`More options for transaction of $${transaction.Amount.toFixed(2)} on ${date}`}>
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
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No transactions for this period.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    
