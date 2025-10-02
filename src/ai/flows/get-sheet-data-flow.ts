'use server';

/**
 * @fileOverview A flow for fetching and parsing data from a public Google Sheet.
 *
 * - getSheetData - Fetches and parses data from a Google Sheet URL.
 */

import { ai } from '@/ai/genkit';
import { mockTransactions } from '@/lib/data';
import {
  GetSheetDataInputSchema,
  GetSheetDataOutputSchema,
  type GetSheetDataInput,
  type GetSheetDataOutput,
} from '@/ai/schemas/get-sheet-data-schema';

export async function getSheetData(
  input: GetSheetDataInput
): Promise<GetSheetDataOutput> {
  return getSheetDataFlow(input);
}

const getSheetDataFlow = ai.defineFlow(
  {
    name: 'getSheetDataFlow',
    inputSchema: GetSheetDataInputSchema,
    outputSchema: GetSheetDataOutputSchema,
  },
  async (input) => {
    // In a real scenario, you would fetch the data from the URL.
    // For now, we are returning mock data.
    // This functionality will be implemented in a future step.
    console.log(`Fetching data from ${input.googleSheetUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return mockTransactions;
  }
);
