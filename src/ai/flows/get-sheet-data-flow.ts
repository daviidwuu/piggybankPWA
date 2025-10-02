'use server';

/**
 * @fileOverview A flow for fetching and parsing data from a public Google Sheet.
 *
 * - getSheetData - Fetches and parses data from a Google Sheet URL.
 */

import { ai } from '@/ai/genkit';
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
    console.log(`Fetching data from ${input.googleSheetUrl}`);
    try {
      const response = await fetch(input.googleSheetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Assuming the Apps Script returns data in the format you described,
      // we need to transform it to match our Transaction schema.
      const transformedData = data.map((row: any, index: number) => ({
        id: String(index + 1), // Or use a unique ID from the sheet if available
        date: new Date(row.Date).toISOString(),
        description: row.Description,
        category: row.Category,
        amount: Number(row.Amount),
      }));

      return transformedData;
    } catch (error) {
      console.error('Failed to fetch or parse sheet data:', error);
      // Return an empty array or throw a more specific error
      // to be handled by the frontend.
      throw new Error('Could not retrieve data from the provided Google Sheet URL.');
    }
  }
);
