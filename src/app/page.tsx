"use client";

import { useEffect, useState } from "react";
import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";
import { type Transaction, type Budget } from "@/lib/data";
import { Balance } from "@/components/dashboard/balance";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TransactionsTable } from "@/components/dashboard/transactions-table";
import { AiAnalysis } from "@/components/dashboard/ai-analysis";
import { Separator } from "@/components/ui/separator";

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyo_FVmlXpdAw1TTUtySgKMafuDoIhY35dQFvAlxE3OxJ3-gT9XufPNbp32huac8fvEkQ/exec";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tx, bd] = await Promise.all([
          getSheetData({ googleSheetUrl: SHEET_API_URL }),
          getBudgetData({ googleSheetUrl: SHEET_API_URL })
        ]);
        setTransactions(tx);
        setBudgets(bd);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalBudget = budgets.reduce((sum, b) => sum + b.Budget, 0);
  const totalSpent = transactions
    .filter(t => t.Type === "Expense")
    .reduce((sum, t) => sum + t.Amount, 0);

  const expenseTransactions = transactions.filter(t => t.Type === 'Expense');

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center">
        <div className="w-full max-w-[428px] border-x border-border p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background items-center">
      <div className="w-full max-w-[428px] border-x border-border">
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <h1 className="text-3xl font-bold text-primary">David</h1>
          </div>
          
          <Balance
            totalSpending={totalSpent}
            budget={totalBudget}
          />
          <Separator />
          <SpendingChart data={expenseTransactions} />
          <AiAnalysis transactions={expenseTransactions} />
          <TransactionsTable data={expenseTransactions} />
        </main>
      </div>
    </div>
  );
}
