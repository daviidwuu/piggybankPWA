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
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/data";
import { ChartConfig } from "../ui/chart";
import { format } from 'date-fns';
import { Button } from "../ui/button";
import { ChevronDown } from "lucide-react";

interface TransactionsTableProps {
  data: Transaction[];
  chartConfig: ChartConfig;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function TransactionsTable({ data, chartConfig, hasMore, onLoadMore }: TransactionsTableProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Your most recent financial activities.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] p-2 pl-6">Date</TableHead>
              <TableHead className="w-[90px] text-right p-2">Amount</TableHead>
              <TableHead className="p-2 pr-6">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((transaction) => {
                const { date, time } = formatDate(transaction.Date);
                return (
                  <TableRow key={transaction.ID}>
                    <TableCell className="font-medium text-xs p-2 pl-6">
                        <div>{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm p-2">
                      ${transaction.Amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-2 pr-6">
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
          <div className="p-4 pt-2">
            <Button
              variant="ghost"
              onClick={onLoadMore}
              className="w-full"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
