
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
    // Make a single request to the Google Apps Script using the `?all=1` parameter
    const res = await fetch(`${googleSheetUrl}?all=1`, {
      method: 'GET',
      cache: 'no-store',
      // IMPORTANT: Don't follow redirects automatically, as this can obscure the real error
      redirect: 'manual', 
    });

    // If the Apps Script redirects (e.g., to a login page), it's a failure.
    if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
        const details = `Request to Google Apps Script resulted in a redirect to ${res.headers.get('location')}. This usually means the script needs to be re-authorized or re-deployed with the correct permissions.`;
        console.error("Google Apps Script Redirect Error:", details);
        return NextResponse.json({ error: "Google Apps Script requires authorization.", details }, { status: 502 }); // 502 Bad Gateway
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const errorText = await res.text();
        let details = `Expected JSON response but got ${contentType || 'an unknown content type'}.`;
        if (errorText.trim().startsWith('<!DOCTYPE html>')) {
            details += ' The script returned an HTML page, which often means you need to re-authorize the script or check its permissions in Google Apps Script.';
        } else {
            details += ` Response: ${errorText}`;
        }
        console.error("Google Apps Script Error:", details);
        return NextResponse.json({ error: "Invalid response from Google Apps Script.", details }, { status: 502 });
    }
    
    const data = await res.json();

    // Expect a response with { transactions: [], budgets: [] }
    const { transactions, budgets } = data;

    // Basic validation of the response structure
    if (!Array.isArray(transactions) || !Array.isArray(budgets)) {
        throw new Error("Invalid data structure from Google Sheet. Expected { transactions: [], budgets: [] } but received something else.");
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
        MonthlyBudget: Number(row["MonthlyBudget"] || 0),
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
