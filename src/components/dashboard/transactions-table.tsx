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

interface TransactionsTableProps {
  data: Transaction[];
  chartConfig: ChartConfig;
}

export function TransactionsTable({ data, chartConfig }: TransactionsTableProps) {
  const sortedData = [...data]
    .sort((a, b) => {
        // Handle null dates by pushing them to the bottom
        if (a.Date === null) return 1;
        if (b.Date === null) return -1;
        const dateA = new Date(a.Date);
        const dateB = new Date(b.Date);
        return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

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
          Your 5 most recent financial activities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] p-2">Date</TableHead>
              <TableHead className="w-[90px] text-right p-2">Amount</TableHead>
              <TableHead className="p-2">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((transaction) => {
                const { date, time } = formatDate(transaction.Date);
                return (
                  <TableRow key={transaction.ID}>
                    <TableCell className="font-medium text-xs p-2">
                        <div>{date}</div>
                        <div className="text-muted-foreground">{time}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm p-2">
                      ${transaction.Amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm p-2">
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
      </CardContent>
    </Card>
  );
}
