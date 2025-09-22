
'use server';

import { createClient } from '@vercel/kv';

// The createClient function automatically uses the Vercel KV environment 
// variables when deployed on Vercel. This simplified setup works for both
// local development (with .env.local) and production.
export const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
