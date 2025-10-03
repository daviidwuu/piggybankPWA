import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";
import { type NextRequest, NextResponse } from "next/server";

// This route is now primarily for client-side fetching to refresh data.
export async function GET(request: NextRequest) {
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

    return NextResponse.json({ transactions, budgets });
  } catch (error) {
    console.error("Failed to fetch from Google Sheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheet." },
      { status: 500 }
    );
  }
}
