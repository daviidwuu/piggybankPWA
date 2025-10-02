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
  insights: z.string().describe('AI-driven insights into spending habits.'),
  recommendations: z
    .string()
    .describe('Personalized recommendations for potential savings.'),
});
export type SpendingInsightsOutput = z.infer<typeof SpendingInsightsOutputSchema>;

export async function getSpendingInsights(input: SpendingInsightsInput): Promise<SpendingInsightsOutput> {
  return spendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingInsightsPrompt',
  input: {schema: SpendingInsightsInputSchema},
  output: {schema: SpendingInsightsOutputSchema},
  prompt: `You are a personal finance advisor. Analyze the following financial data and provide insights and recommendations to help the user understand their spending habits and identify potential savings.

Financial Data:
{{financialData}}

Provide clear and actionable insights into the user's spending habits, identifying areas where they are spending the most money.
Offer personalized recommendations on how the user can save money based on their spending patterns.`,
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
