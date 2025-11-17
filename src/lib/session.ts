
'use server';

import { cookies } from 'next/headers';
import { verifyAuth } from './auth';
import type { User } from './types';

/**
 * A server-side helper function to get the current user's session data from the JWT cookie.
 * This replaces the dependency on `getServerSession` from `next-auth`.
 */
export async function getCurrentUser(): Promise<User | undefined> {
  try {
    const verifiedToken = await verifyAuth();
    return verifiedToken;
  } catch (err) {
    console.error('Falha ao obter usuário atual, token inválido:', (err as Error).message);
    return undefined;
  }
}
