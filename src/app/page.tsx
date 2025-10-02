import { Dashboard } from "@/app/dashboard";
import { type Transaction, type Budget } from "@/lib/data";

async function getInitialData() {
  // This fetch is now happening on the server at build time or on first request.
  const res = await fetch(`${process.env.HOST_URL}/api/sheet`);
  if (!res.ok) {
    console.error('Failed to fetch initial data');
    return { transactions: [], budgets: [] };
  }
  return res.json();
}

export default async function Page() {
  const initialData: { transactions: Transaction[], budgets: Budget[] } = await getInitialData();
  
  return <Dashboard initialData={initialData} />;
}
