import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit and the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
  // Log to the console in development
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
