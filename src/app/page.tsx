import { Dashboard } from "@/app/dashboard";
import { type Transaction, type Budget } from "@/lib/data";
import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";

async function getInitialData(): Promise<{ transactions: Transaction[], budgets: Budget[] }> {
  const googleSheetUrl = process.env.GOOGLE_SHEET_API_URL;

  if (!googleSheetUrl) {
    console.error("Google Sheet URL is not configured.");
    return { transactions: [], budgets: [] };
  }

  try {
    // Fetch data directly on the server during build/render time.
    const [transactions, budgets] = await Promise.all([
      getSheetData({ googleSheetUrl }),
      getBudgetData({ googleSheetUrl }),
    ]);
    return { transactions, budgets };
  } catch (error) {
    console.error("Failed to fetch initial data from Google Sheet:", error);
    // Return empty arrays on error to allow the page to render.
    return { transactions: [], budgets: [] };
  }
}

export default async function Page() {
  const initialData = await getInitialData();
  
  return <Dashboard initialData={initialData} />;
}
