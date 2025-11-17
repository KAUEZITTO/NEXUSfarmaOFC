
'use server';

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';

import type { User, Role, SubRole, AccessLevel, UserLocation } from './types';
import { firebaseApp } from './firebase/client';
import { readData, writeData, getUnits } from './data';

const secretKey = process.env.NEXTAUTH_SECRET;
if (!secretKey) {
  throw new Error('A variável de ambiente NEXTAUTH_SECRET não está definida.');
}
const key = new TextEncoder().encode(secretKey);

// --- JWT and Session Management ---

async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifyAuth(req?: NextRequest) {
  const token = req ? req.cookies.get('session_token')?.value : cookies().get('session_token')?.value;

  if (!token) {
    throw new Error('Token de sessão não encontrado.');
  }

  try {
    const verified = await decrypt(token);
    return verified as User;
  } catch (err) {
    throw new Error('Seu token de sessão expirou ou é inválido.');
  }
}

export async function getCurrentUser(): Promise<User | undefined> {
  try {
    const verifiedToken = await verifyAuth();
    return verifiedToken;
  } catch (err) {
    return undefined;
  }
}

export async function signOut() {
  cookies().delete('session_token');
}

export async function signInWithCredentials(credentials: { email: string; password?: string }): Promise<{ success: boolean; error?: string }> {
    if (!credentials.email || !credentials.password) {
        return { success: false, error: "Email e senha são obrigatórios." };
    }

    try {
        const auth = getAuth(firebaseApp);
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            return { success: false, error: "Email ou senha inválidos." };
        }
        console.error("Firebase sign-in error in Server Action:", error);
        return { success: false, error: "Ocorreu um erro no servidor de autenticação." };
    }

    const user = await validateAndGetUser(credentials.email);
    if (!user) {
        return { success: false, error: "Usuário autenticado, mas não encontrado no banco de dados do NexusFarma." };
    }

    const token = await encrypt(user);
    
    cookies().set('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: '/',
    });
    
    await updateUserLastSeen(user.id);

    return { success: true };
}


// --- User Validation and Data Update ---

export async function validateAndGetUser(email: string): Promise<User | null> {
    if (!email) return null;
    try {
        const users = await readData<User>('users');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;

        if (user.email === 'kauemoreiraofc2@gmail.com') {
            user.accessLevel = 'Admin';
            user.subRole = 'Coordenador';
        }
        
        if (user.location === 'Hospital' && !user.locationId) {
            const units = await readData<import('./types').Unit>('units');
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if (hospitalUnit) {
                user.locationId = hospitalUnit.id;
            }
        }

        const { password, ...userForSession } = user;
        return userForSession as User;

    } catch (error) {
        console.error("CRITICAL: Failed to read user data from Vercel KV in validateAndGetUser.", error);
        return null;
    }
}

export async function updateUserLastSeen(userId: string) {
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        users[userIndex].lastSeen = new Date().toISOString();
        await writeData('users', users);
    }
}


// --- User Registration ---
const avatarColors = [
  'hsl(211 100% 50%)', // Blue
  'hsl(39 100% 50%)', // Orange
  'hsl(0 84.2% 60.2%)', // Red
  'hsl(142.1 76.2% 36.3%)', // Green
  'hsl(262.1 83.3% 57.8%)', // Purple
  'hsl(314.5 72.4% 57.3%)', // Pink
  'hsl(198.8 93.4% 42%)' // Teal
];

export async function register(data: { name: string, email: string; password: string; birthdate: string; role: Role; subRole?: SubRole; location?: UserLocation; }) {
    const { name, email, password, birthdate, role, subRole, location } = data;

    try {
        const adminApp = getAdminApp(); 
        const auth = getAdminAuth(adminApp);

        const users = await readData<User>('users');

        if (users.some(u => u.email === email)) {
            return { success: false, message: 'Este email já está em uso.' };
        }
        
        try {
            await auth.getUserByEmail(email);
            return { success: false, message: 'Este email já está registrado no sistema de autenticação.' };
        } catch (error: any) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        const userRecord = await auth.createUser({
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
            const units = await getUnits();
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

    