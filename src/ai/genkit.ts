import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';

// Initialize Genkit and the Google AI plugin
export const ai = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
    googleCloud(),
  ],
  // Log to the console in development
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  // Manage flow state in Google Cloud Storage
  flowStateStore: 'googleCloud',
  // Provide long-term memory to flows
  traceStore: 'googleCloud',
});
