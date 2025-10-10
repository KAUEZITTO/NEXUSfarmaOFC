
'use server';

import { readData, writeData } from './data';
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

    const allUsers = await readData<User>('users');
    
    // 1. Tenta encontrar pelo ID (método mais confiável)
    let existingUser = allUsers.find(u => u.id === credentials.uid);
    if (existingUser) {
        return existingUser;
    }

    // 2. Se não encontrou pelo ID, tenta pelo email (fallback para consistência)
    existingUser = allUsers.find(u => u.email === credentials.email);
    if (existingUser) {
        if (existingUser.id !== credentials.uid) {
            console.warn(`Inconsistência de ID encontrada para ${credentials.email}. Atualizando para o ID correto do Firebase.`);
            existingUser.id = credentials.uid;
            const userIndex = allUsers.findIndex(u => u.email === credentials.email);
            if (userIndex !== -1) {
                allUsers[userIndex] = existingUser;
                await writeData('users', allUsers);
            }
        }
        return existingUser;
    }

    // 3. Se não existe de forma alguma, cria um novo perfil.
    console.log(`Nenhum perfil encontrado para ${credentials.email}. Criando um novo...`);
    const newUser: User = {
        id: credentials.uid,
        email: credentials.email,
        name: credentials.displayName || credentials.email.split('@')[0],
        image: credentials.photoURL || undefined,
        role: 'Farmacêutico', // Role padrão
        accessLevel: allUsers.length === 0 ? 'Admin' : 'User', // O primeiro usuário é sempre Admin.
    };

    try {
        await writeData('users', [...allUsers, newUser]);
        console.log(`Novo perfil criado com sucesso para ${credentials.email}.`);
        return newUser;
    } catch (error) {
        console.error(`Falha ao criar o perfil para ${credentials.email}:`, error);
        return null;
    }
}
