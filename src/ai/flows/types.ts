
import { z } from 'genkit';

/**
 * @fileOverview Type definitions for Genkit flows.
 */

export const PushNotificationInputSchema = z.object({
  userId: z.string().describe("The ID of the user to send the notification to."),
  message: z.string().describe("The content of the notification message."),
});
export type PushNotificationInput = z.infer<typeof PushNotificationInputSchema>;

export const PushNotificationOutputSchema = z.object({
  successCount: z.number().describe("The number of messages that were sent successfully."),
  failureCount: z.number().describe("The number of messages that failed to be sent."),
  errors: z.array(z.string()).describe("A list of error messages for failed deliveries."),
});
export type PushNotificationOutput = z.infer<typeof PushNotificationOutputSchema>;
