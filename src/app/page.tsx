"use client";

import { useState } from "react";
import { mockTransactions, type Transaction } from "@/lib/data";
import { Header } from "@/components/dashboard/header";
import { DataImporter } from "@/components/dashboard/data-importer";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Wallet, Landmark, ArrowDownUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const handleImport = () => {
    // In a real app, you'd fetch and parse the Google Sheet.
    // For this demo, we'll just use mock data with a slight delay.
    setTimeout(() => {
      setTransactions(mockTransactions);
      setIsDataLoaded(true);
    }, 1000);
  };

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

  const categorySpending = transactions.reduce(
    (acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const topCategory = Object.entries(categorySpending).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <DataImporter onImport={handleImport} isDataLoaded={isDataLoaded} />

        {isDataLoaded && (
          <div className="space-y-8 animate-in fade-in-0 duration-500">
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard
                title="Total Spending"
                value={`$${totalSpending.toFixed(2)}`}
                icon={<Wallet className="h-6 w-6 text-muted-foreground" />}
                description="Total amount spent this period"
              />
              <KpiCard
                title="Top Category"
                value={topCategory ? topCategory[0] : "N/A"}
                icon={<Landmark className="h-6 w-6 text-muted-foreground" />}
                description={`$${
                  topCategory ? topCategory[1].toFixed(2) : "0.00"
                } spent`}
              />
              <KpiCard
                title="Transactions"
                value={transactions.length.toString()}
                icon={<ArrowDownUp className="h-6 w-6 text-muted-foreground" />}
                description="Total number of transactions"
              />
            </div>

            <Separator />

            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <SpendingChart data={transactions} />
              </div>
              <div className="lg:col-span-2">
                <AiAnalysis transactions={transactions} />
              </div>
            </div>

            <TransactionsTable data={transactions} />
          </div>
        )}
      </main>
    </div>
  );
}
