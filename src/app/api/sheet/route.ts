
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
    if (res.type === 'opaqueredirect' || res.status > 300) {
        let details = `Request to Google Apps Script failed with status: ${res.status}. This might be due to an incorrect URL or an issue with the script.`;
        // Try to get more details if possible
        try {
            const errorText = await res.text();
             // Check if the error text is actually HTML
            if (errorText.trim().startsWith('<!DOCTYPE html>')) {
              details += ' The script returned an HTML page instead of JSON. This often means you need to re-authorize the script or check its permissions in Google Apps Script.';
            } else {
              details += ` Response: ${errorText}`;
            }
        } catch (e) {
             // Ignore if we can't read the body
        }
        console.error("Google Apps Script Error:", details);
        return NextResponse.json({ error: "Google Apps Script failed.", details }, { status: 502 }); // 502 Bad Gateway is appropriate here
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const details = `Expected JSON response but got ${contentType || 'an unknown content type'}. Please check the Google Apps Script.`;
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
