import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";
import { type NextRequest, NextResponse } from "next/server";
import { type Transaction, type Budget } from "@/lib/data";

interface CachedData {
  transactions: Transaction[];
  budgets: Budget[];
  timestamp: number;
}

let cache: CachedData | null = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const revalidate = searchParams.get('revalidate') === 'true';

  const now = Date.now();

  if (!revalidate && cache && (now - cache.timestamp < CACHE_DURATION)) {
    return NextResponse.json({ transactions: cache.transactions, budgets: cache.budgets });
  }

  const googleSheetUrl = process.env.GOOGLE_SHEET_API_URL;

  if (!googleSheetUrl) {
    return NextResponse.json(
      { error: "Google Sheet URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const [transactions, budgets] = await Promise.all([
      getSheetData({ googleSheetUrl }),
      getBudgetData({ googleSheetUrl }),
    ]);

    cache = {
      transactions,
      budgets,
      timestamp: now,
    };

    return NextResponse.json({ transactions, budgets });
  } catch (error) {
    console.error("Failed to fetch from Google Sheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheet." },
      { status: 500 }
    );
  }
}
