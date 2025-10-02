'use server';

import { type Transaction } from '@/lib/data';

export async function getSheetData({
  googleSheetUrl,
}: {
  googleSheetUrl: string;
}): Promise<Transaction[]> {
  const res = await fetch(googleSheetUrl, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sheet data: ${res.statusText}`);
  }

  const data = await res.json();

  return data.map((row: any) => {
    const date = new Date(row['Date']);
    return {
      ID: String(row['ID'] || ''),
      // Standardize to ISO string for reliable parsing later
      Date: !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
      Amount: Number(row['Amount'] || 0),
      Type: String(row['Type'] || ''),
      Category: String(row['Category'] || 'Uncategorized'),
      Notes: String(row['Notes'] || ''),
    }
  });
}
