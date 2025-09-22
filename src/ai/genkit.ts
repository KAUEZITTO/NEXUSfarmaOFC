import {genkit} from 'genkit';

// Initialize Genkit
export const ai = genkit({
  plugins: [
    // googleAI plugin is intentionally left empty.
    // To enable, you would add the plugin here:
    //
    // import {googleAI} from '@genkit-ai/googleai';
    // plugins: [googleAI()],
  ],
  // Log to the console in development
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
});
