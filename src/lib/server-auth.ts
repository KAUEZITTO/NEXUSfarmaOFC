
'use server';

import { readData, writeData, getOrCreateUser } from './data';
import type { User } from './types';
import { adminAuth } from './firebase/admin'; // A importação do admin fica isolada aqui

/**
 * Valida as credenciais do usuário e garante que um perfil exista no banco de dados.
 * Esta função é chamada dinamicamente para evitar problemas de build com o Firebase Admin.
 */
export async function validateUserCredentials(credentials: any): Promise<User | null> {
    
    // Verificação de segurança: verificar o token se disponível, ou confiar no UID.
    // Para maior segurança, poderíamos validar o ID token do Firebase aqui.
    // Por enquanto, confiamos que a autenticação no cliente foi bem sucedida.

    const userProfile = await getOrCreateUser({
        id: credentials.uid,
        email: credentials.email,
        name: credentials.displayName,
        image: credentials.photoURL,
    });
    
    return userProfile;
}
