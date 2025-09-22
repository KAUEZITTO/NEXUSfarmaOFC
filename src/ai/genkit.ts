import {genkit} from 'genkit';

// Initialize Genkit
export const ai = genkit({
  plugins: [
    // googleAI({
    //   apiVersion: 'v1beta',
    // }),
  ],
  // Log to the console in development
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
