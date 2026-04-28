'use server';
/**
 * @fileOverview A Genkit flow for generating professional meeting descriptions based on brief inputs.
 *
 * - generateMeetingDescription - A function that handles the meeting description generation process.
 * - GenerateMeetingDescriptionInput - The input type for the generateMeetingDescription function.
 * - GenerateMeetingDescriptionOutput - The return type for the generateMeetingDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMeetingDescriptionInputSchema = z.object({
  briefInput: z
    .string()
    .describe(
      'Keywords or a brief sentence describing the meeting purpose. The AI will expand this into a professional description.'
    ),
});
export type GenerateMeetingDescriptionInput = z.infer<
  typeof GenerateMeetingDescriptionInputSchema
>;

const GenerateMeetingDescriptionOutputSchema = z.string().describe('The generated professional meeting description.');
export type GenerateMeetingDescriptionOutput = z.infer<
  typeof GenerateMeetingDescriptionOutputSchema
>;

export async function generateMeetingDescription(
  input: GenerateMeetingDescriptionInput
): Promise<GenerateMeetingDescriptionOutput> {
  return generateMeetingDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMeetingDescriptionPrompt',
  input: {schema: GenerateMeetingDescriptionInputSchema},
  output: {schema: GenerateMeetingDescriptionOutputSchema},
  prompt: `You are an AI assistant specialized in generating clear, concise, and professional meeting descriptions.

Expand the following keywords or brief input into a comprehensive and professional meeting description, suitable for an official meeting invitation or agenda.

Brief Input: {{{briefInput}}}`,
});

const generateMeetingDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMeetingDescriptionFlow',
    inputSchema: GenerateMeetingDescriptionInputSchema,
    outputSchema: GenerateMeetingDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
