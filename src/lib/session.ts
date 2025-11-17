'use server';

import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { readData } from '@/lib/data';
import type { User } from './types';

/**
 * Obtém o usuário atualmente autenticado a partir do token de sessão do cookie.
 * Esta função é para ser usada em ambientes server-only (Server Components, Route Handlers, Server Actions).
 * 
 * @returns {Promise<User | null>} O objeto completo do usuário se autenticado e válido, caso contrário, null.
 */
export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    // 1. Verifica se o token JWT é válido usando o Firebase Admin.
    // Isso confirma que o token foi emitido pelo Firebase e não expirou.
    const decodedToken = await getAuth(getAdminApp()).verifyIdToken(token);
    
    // 2. Com o token decodificado, temos o UID do usuário.
    // Agora, buscamos o perfil completo do usuário em nosso banco de dados (Vercel KV).
    // Isso é crucial para obter os dados de permissão (role, accessLevel, etc.) que não estão no token.
    const allUsers = await readData<User>('users');
    const user = allUsers.find(u => u.id === decodedToken.uid);

    if (user) {
        // Remove a senha e retorna o objeto de usuário completo e seguro para uso na sessão.
        const { password, ...userForSession } = user;
        return userForSession as User;
    }

    // Se o usuário existe no Firebase Auth mas não no nosso banco de dados, consideramos inválido.
    return null;

  } catch (error) {
    // Se a verificação do token falhar (inválido, expirado, etc.), ou se houver qualquer outro erro,
    // retornamos null para indicar que não há um usuário autenticado.
    console.warn("Falha na verificação da sessão:", (error as Error).message);
    return null;
  }
}
