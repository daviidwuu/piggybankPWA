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

interface TransactionsTableProps {
  data: Transaction[];
  chartConfig: ChartConfig;
}

export function TransactionsTable({ data, chartConfig }: TransactionsTableProps) {
  const sortedData = [...data]
    .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
    .slice(0, 5);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((transaction) => (
              <TableRow key={transaction.ID}>
                <TableCell>
                  {formatDate(transaction.Date)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      className="whitespace-nowrap"
                      style={{ 
                        backgroundColor: chartConfig[transaction.Category]?.color,
                        color: 'hsl(var(--primary-foreground))'
                      }}
                    >
                      {transaction.Category}
                    </Badge>
                    <span className="font-medium">{transaction.Notes}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${transaction.Amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
