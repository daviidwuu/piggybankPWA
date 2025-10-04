
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { googleSheetUrl, userId, ...newEntry } = await request.json();

    if (!googleSheetUrl) {
      return NextResponse.json(
        { error: "Google Sheet URL is not configured." },
        { status: 400 }
      );
    }

    const payload = {
        ...newEntry,
        data: {
            ...newEntry.data,
            userId: userId
        }
    };

    // Forward the POST request to the Google Apps Script
    const response = await fetch(googleSheetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      // IMPORTANT: Don't follow redirects automatically, as this can obscure the real error
      redirect: 'manual', 
    });
    
    // If the Apps Script redirects (e.g., to an error page), it's a failure.
    if (response.type === 'opaqueredirect' || response.status > 300) {
        let details = `Request to Google Apps Script failed with status: ${response.status}. This might be due to an incorrect URL or an issue with the script itself.`;
         // Try to get more details if possible, but handle cases where it's not JSON
        try {
            const errorText = await response.text();
            // Check if the error text is actually HTML
            if (errorText.trim().startsWith('<!DOCTYPE html>')) {
              details += ' The script returned an HTML page instead of JSON, which usually indicates a login or permission issue on the Google side.';
            } else {
              details += ` Response: ${errorText}`;
            }
        } catch (e) {
            // Ignore if we can't read the body
        }
        console.error("Google Apps Script Error:", details);
        return NextResponse.json({ error: "Google Apps Script failed.", details }, { status: 502 });
    }
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const result = await response.json();
        return NextResponse.json({ success: true, data: result });
    } else {
        const details = "The Google Apps Script did not return a valid JSON response.";
        console.error("Google Apps Script Error:", details);
        return NextResponse.json({ error: "Invalid response from Google Apps Script.", details }, { status: 502 });
    }

  } catch (error) {
    console.error("Failed to add entry via Google Sheet:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to add entry to Google Sheet.", details: errorMessage },
      { status: 500 }
    );
  }
}
