import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const googleSheetUrl = process.env.GOOGLE_SHEET_API_URL;

  if (!googleSheetUrl) {
    return NextResponse.json(
      { error: "Google Sheet URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const newEntry = await request.json();

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
            { error: `Google Apps Script failed: ${errorText}` },
            { status: response.status }
        );
    }

    const result = await response.json();

    // Revalidate the cache after adding a new entry
    // We don't need to wait for this to finish
    fetch(`${request.nextUrl.origin}/api/sheet?revalidate=true`);
    

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
