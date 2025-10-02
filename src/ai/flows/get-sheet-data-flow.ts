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
import { z } from 'zod';

const FlowOutputSchema = z.object({
  data: GetSheetDataOutputSchema.optional(),
  error: z.string().optional(),
});
type FlowOutput = z.infer<typeof FlowOutputSchema>;

export async function getSheetData(
  input: GetSheetDataInput
): Promise<GetSheetDataOutput> {
  const result = await getSheetDataFlow(input);
  if (result.error) {
    // We are throwing the error here to be caught by the component
    // which will then display a toast.
    throw new Error(result.error);
  }
  return result.data || [];
}

const getSheetDataFlow = ai.defineFlow(
  {
    name: 'getSheetDataFlow',
    inputSchema: GetSheetDataInputSchema,
    outputSchema: FlowOutputSchema,
  },
  async (input): Promise<FlowOutput> => {
    console.log(`Fetching data from ${input.googleSheetUrl}`);
    try {
      const response = await fetch(input.googleSheetUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const validationResult = z.array(z.any()).safeParse(data);
      if (!validationResult.success) {
        throw new Error('Sheet data is not in the expected array format.');
      }

      const transformedData = validationResult.data.map(
        (row: any, index: number) => {
          const date = new Date(row.Date);
          if (isNaN(date.getTime())) {
            console.warn(
              `Invalid date found at row ${index + 2}:`,
              row.Date
            );
            // Fallback to a valid date to avoid crashing, e.g., now.
            // Or you could skip the row entirely.
            return {
              id: String(index + 1),
              date: new Date().toISOString(),
              Description: row.Description || 'Invalid Row',
              Category: 'Other',
              amount: 0,
            };
          }
          return {
            id: String(index + 1),
            date: date.toISOString(),
            Description: row.Description,
            Category: row.Category,
            amount: Number(row.Amount),
          };
        }
      );

      const finalValidation =
        GetSheetDataOutputSchema.safeParse(transformedData);
      if (!finalValidation.success) {
        console.error('Data validation failed', finalValidation.error.flatten());
        throw new Error('One or more rows in the sheet have incorrect data types after transformation.');
      }

      return { data: finalValidation.data };
    } catch (error: any) {
      console.error('Failed to fetch or parse sheet data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        error: `Could not retrieve or process data from the provided Google Sheet URL. Reason: ${errorMessage}`,
      };
    }
  }
);
