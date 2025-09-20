
import { createClient } from '@vercel/kv';

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error("Missing Vercel KV environment variables in production");
    }
    console.warn("Vercel KV environment variables not found. Using mock KV client for local development.");
    
    // Simple in-memory mock for local development without Redis
    const memoryStore = new Map<string, any>();
    const mockKv = {
        get: async <T>(key: string): Promise<T | null> => {
            return memoryStore.get(key) || null;
        },
        set: async (key: string, value: any): Promise<void> => {
            memoryStore.set(key, value);
        }
    };
    
    // Use 'any' to bypass strict type checking for the mock
    module.exports = { kv: mockKv as any };

} else {
    const kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    module.exports = { kv };
}
