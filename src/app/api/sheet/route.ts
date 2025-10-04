
import { type NextRequest, NextResponse } from "next/server";
import { type Transaction, type Budget } from "@/lib/data";

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
    // Make a single request to the Google Apps Script
    const res = await fetch(googleSheetUrl, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Google Apps Script Error:", errorText);
      throw new Error(`Failed to fetch sheet data: ${res.statusText} - ${errorText}`);
    }

    // Expect a response with { transactions: [], budgets: [] }
    const { transactions, budgets } = await res.json();

    // Basic validation of the response structure
    if (!Array.isArray(transactions) || !Array.isArray(budgets)) {
        throw new Error("Invalid data structure from Google Sheet.");
    }
    
    // Process transactions data
    const processedTransactions: Transaction[] = transactions.map((row: any, index: number) => {
        const date = new Date(row['Date']);
        const dateString = !isNaN(date.getTime()) ? date.toISOString() : null;
        return {
          ID: `tx-${index}-${dateString}-${row['Amount']}`,
          Date: dateString,
          Amount: Number(row['Amount'] || 0),
          Type: String(row['Type'] || ''),
          Category: String(row['Category'] || 'Uncategorized'),
          Notes: String(row['Notes'] || ''),
        }
      });

    // Process budget data
    const processedBudgets: Budget[] = budgets.map((row: any) => ({
        Category: String(row["Category"] || ""),
        Budget: Number(row["Budget"] || 0),
      }));


    return NextResponse.json({ transactions: processedTransactions, budgets: processedBudgets });
  } catch (error) {
    console.error("Failed to fetch from Google Sheet:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheet.", details: errorMessage },
      { status: 500 }
    );
  }
}
