
'use server';

import { writeData, getAllUsers, getUnits as getUnitsFromDb } from '@/lib/data';
import type { User, Role, SubRole, UserLocation } from '@/lib/types';
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

        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso.' };
        }
        
        try {
            await adminAuth.getUserByEmail(email);
            return { success: false, message: 'Este email já está registrado no sistema de autenticação.' };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: name,
        });
        
        const isFirstUser = users.length === 0;

        const userLocation = subRole === 'Coordenador' ? 'CAF' : location;
        if (!userLocation) {
            return { success: false, message: 'O local de trabalho é obrigatório para este cargo.' };
        }
        
        let locationId;
        if (userLocation === 'Hospital') {
            const units = await getUnitsFromDb();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if(hospitalUnit) locationId = hospitalUnit.id;
        }

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

    