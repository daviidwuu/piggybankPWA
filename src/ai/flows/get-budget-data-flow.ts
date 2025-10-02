'use server';

import { type Budget } from "@/lib/data";

export async function getBudgetData({ googleSheetUrl }: { googleSheetUrl: string }): Promise<Budget[]> {
  const res = await fetch(`${googleSheetUrl}?budget=1`, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch budget data");
  }
  const data = await res.json();
  return data.map((row: any) => ({
    Category: String(row["Category"] || ""),
    Budget: Number(row["Budget"] || 0),
  }));
}
