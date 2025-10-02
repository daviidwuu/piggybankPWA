import { z } from 'zod';

export const GetSheetDataInputSchema = z.object({
  googleSheetUrl: z
    .string()
    .url()
    .describe('The URL of the public Google Sheet to fetch data from.'),
});
export type GetSheetDataInput = z.infer<typeof GetSheetDataInputSchema>;

const TransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string(),
  category: z.enum([
    'Food',
    'Transport',
    'Shopping',
    'Utilities',
    'Entertainment',
    'Other',
  ]),
  amount: z.number(),
});

export const GetSheetDataOutputSchema = z.array(TransactionSchema);
export type GetSheetDataOutput = z.infer<typeof GetSheetDataOutputSchema>;
