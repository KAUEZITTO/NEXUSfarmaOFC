import { createClient } from '@vercel/kv';

// This will automatically use the Vercel KV connection strings
// when deployed on Vercel.
export const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
