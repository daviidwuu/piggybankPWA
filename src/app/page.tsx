import { Dashboard } from "@/app/dashboard";
import { type Transaction, type Budget } from "@/lib/data";

// This page now renders instantly and fetches data on the client.
export default function Page() {
  const initialData: { transactions: Transaction[], budgets: Budget[] } = { 
    transactions: [], 
    budgets: [] 
  };
  
  return <Dashboard initialData={initialData} />;
}
