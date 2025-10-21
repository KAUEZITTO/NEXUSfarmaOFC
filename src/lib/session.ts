
import 'server-only';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Gets the current user from the server session.
 * This is the centralized place to get user information on the server-side.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}
