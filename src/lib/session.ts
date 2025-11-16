
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { User } from './types';

/**
 * A server-side helper function to get the current user's session data.
 * This should be used in Server Actions and other server-side logic
 * instead of importing `next-auth` directly, to avoid build errors.
 */
export async function getCurrentUser(): Promise<User | undefined> {
    const session = await getServerSession(authOptions);
    return session?.user;
}
