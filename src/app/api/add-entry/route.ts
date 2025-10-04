import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { googleSheetUrl, ...newEntry } = await request.json();

    if (!googleSheetUrl) {
      return NextResponse.json(
        { error: "Google Sheet URL is not configured." },
        { status: 400 }
      );
    }

    // Forward the POST request to the Google Apps Script
    const response = await fetch(googleSheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEntry),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Google Apps Script Error:", errorText);
        // Propagate the actual error from the script
        return NextResponse.json(
            { error: "Google Apps Script failed.", details: errorText },
            { status: response.status }
        );
    }

    const result = await response.json();
    
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to add entry via Google Sheet:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to add entry to Google Sheet.", details: errorMessage },
      { status: 500 }
    );
  }
}
