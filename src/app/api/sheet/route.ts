import { getSheetData } from "@/ai/flows/get-sheet-data-flow";
import { getBudgetData } from "@/ai/flows/get-budget-data-flow";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const googleSheetUrl = searchParams.get('url');

  if (!googleSheetUrl) {
    return NextResponse.json(
      { error: "Google Sheet URL is required." },
      { status: 400 }
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheet.", details: errorMessage },
      { status: 500 }
    );
  }
}
