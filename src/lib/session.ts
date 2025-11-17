
'use server';

import { cookies } from 'next/headers';
import { verifyAuth } from './auth';
import type { User } from './types';

/**
 * A server-side helper function to get the current user's session data from the JWT cookie.
 * This replaces the dependency on `getServerSession` from `next-auth`,
 * aligning with our new manual JWT-based session management.
 */
export async function getCurrentUser(): Promise<User | undefined> {
  const verifiedToken = await verifyAuth().catch((err) => {
    console.error('Falha ao verificar token de sessão:', err);
    return null;
  });

  if (!verifiedToken) {
    return undefined;
  }

  // A "carga útil" (payload) do nosso token já é o objeto do usuário.
  return verifiedToken as User;
}
