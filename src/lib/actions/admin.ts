
'use server';

import { writeData, getAllUsers, getUnits as getUnitsFromDb } from '@/lib/data';
import type { User, Role, SubRole, UserLocation, AccessLevel } from '@/lib/types';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

const avatarColors = [
  'hsl(211 100% 50%)', 'hsl(39 100% 50%)', 'hsl(0 84.2% 60.2%)',
  'hsl(142.1 76.2% 36.3%)', 'hsl(262.1 83.3% 57.8%)', 'hsl(314.5 72.4% 57.3%)', 'hsl(198.8 93.4% 42%)'
];

export async function register(data: { name: string, email: string; password: string; birthdate: string; role: Role; subRole?: SubRole; location?: UserLocation; }) {
    const { name, email, password, birthdate, role, subRole, location } = data;

    try {
        const adminAuth = getAuth(getAdminApp());
        const users = await getAllUsers();

        // 1. Verifica se o email já está em uso no nosso banco de dados
        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso no banco de dados do NexusFarma.' };
        }
        
        // 2. Verifica se o email já existe no Firebase Auth (proteção extra)
        try {
            await adminAuth.getUserByEmail(email);
            // Se não deu erro, o usuário já existe no Firebase Auth, mas não no nosso BD.
            return { success: false, message: 'Este email já está registrado no sistema de autenticação, mas não no NexusFarma. Contate o suporte.' };
        } catch (error: any) {
            // Se o erro for "user-not-found", ótimo, podemos continuar.
            if (error.code !== 'auth/user-not-found') {
                // Outro erro inesperado do Firebase
                throw error;
            }
        }

        // 3. Cria o usuário no Firebase Auth
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: name,
        });
        
        const isFirstUser = users.length === 0;

        const userLocation = subRole === 'Coordenador' ? 'CAF' : location;
        if (!userLocation) {
            // Esta validação deve ser feita no lado do cliente, mas como segurança.
            return { success: false, message: 'O local de trabalho é obrigatório para este cargo.' };
        }
        
        let locationId;
        if (userLocation === 'Hospital') {
            const units = await getUnitsFromDb();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if(hospitalUnit) locationId = hospitalUnit.id;
        }

        // 4. Cria o usuário no nosso banco de dados Vercel KV
        const newUser: User = {
            id: userRecord.uid,
            email,
            name,
            birthdate,
            location: userLocation,
            locationId,
            role,
            subRole: role === 'Farmacêutico' ? subRole : undefined,
            accessLevel: isFirstUser ? 'Admin' : 'User',
            avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
        };

        await writeData<User>('users', [...users, newUser]);
        revalidatePath('/dashboard/user-management');

        return { success: true, message: 'Usuário registrado com sucesso.' };

    } catch (error: any) {
        console.error("Registration error:", error);
        if (error.code === 'auth/email-already-exists') {
            return { success: false, message: 'Este email já está em uso.' };
        }
        if (error.code === 'auth/weak-password') {
            return { success: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
        }
        return { success: false, message: `Ocorreu um erro desconhecido ao criar a conta: ${error.message}` };
    }
}


export async function updateUserAccessLevel(userId: string, accessLevel: AccessLevel) {
    const users = await getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    users[userIndex].accessLevel = accessLevel;
    await writeData('users', users);
    revalidatePath('/dashboard/user-management');
}

export async function deleteUser(userId: string) {
    const adminAuth = getAuth(getAdminApp());
    const users = await getAllUsers();
    
    // 1. Encontra o usuário no nosso banco de dados para garantir que ele existe
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        // Se o usuário não existe no nosso BD, tentamos remover do Auth por segurança, mas retornamos erro.
        try { await adminAuth.deleteUser(userId); } catch (e) {}
        throw new Error('Usuário não encontrado no banco de dados do NexusFarma.');
    }

    // 2. Tenta excluir o usuário do Firebase Authentication primeiro.
    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        // Se o usuário já não existe no Firebase Auth, podemos ignorar o erro e continuar.
        if (error.code !== 'auth/user-not-found') {
            console.error("Erro ao excluir usuário do Firebase Auth:", error);
            // Se a exclusão no Firebase Auth falhar por outro motivo, não continuamos.
            throw new Error('Erro ao excluir usuário do sistema de autenticação. A operação foi abortada.');
        }
    }

    // 3. Se a exclusão no Firebase Auth foi bem-sucedida (ou o usuário já não estava lá), remove do nosso banco.
    const updatedUsers = users.filter(u => u.id !== userId);
    await writeData('users', updatedUsers);
    
    // 4. Revalida o cache da página de gerenciamento de usuários.
    revalidatePath('/dashboard/user-management');
}
