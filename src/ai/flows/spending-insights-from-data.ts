'use server';

/**
 * @fileOverview Provides AI-driven insights and personalized recommendations on spending habits based on financial data.
 *
 * - `getSpendingInsights` - A function that takes financial data and returns insights and recommendations.
 * - `SpendingInsightsInput` - The input type for the `getSpendingInsights` function.
 * - `SpendingInsightsOutput` - The return type for the `getSpendingInsights` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingInsightsInputSchema = z.object({
  financialData: z
    .string()
    .describe(
      'A string containing financial data, such as transactions, expenses, and income.'
    ),
});
export type SpendingInsightsInput = z.infer<typeof SpendingInsightsInputSchema>;

const SpendingInsightsOutputSchema = z.object({
  summary: z.string().describe('A one-sentence summary of the spending habits.'),
  insights: z.array(z.string()).describe('A list of 2-3 key insights into spending habits.'),
  recommendations: z
    .array(z.string())
    .describe('A list of 2-3 personalized recommendations for potential savings.'),
});
export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function getSpendingInsights(input: SpendingInsightsInput): Promise<SpendingInsightsOutput> {
  return spendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: {schema: SpendingInsightsInputSchema},
  output: {schema: SpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following financial data and provide a concise summary, key insights, and actionable recommendations.

Financial Data:
{{financialData}}

Your response should be structured with:
1. A one-sentence summary of the user's spending.
2. A list of 2-3 key insights, focusing on the most significant spending categories or trends.
3. A list of 2-3 personalized, actionable recommendations for saving money based on the data.`,
});

const spendingInsightsFlow = ai.defineFlow(
  {
    name: 'spendingInsightsFlow',
    inputSchema: SpendingInsightsInputSchema,
    outputSchema: SpendingInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
