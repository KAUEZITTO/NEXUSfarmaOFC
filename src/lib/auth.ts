
'use server';

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import type { User } from './types';
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

export async function decrypt(token: string) {
    const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
    });
    return payload;
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
  const token = cookies().get('session_token')?.value;
  if (!token) return undefined;
  try {
    const verified = await decrypt(token);
    return verified as User;
  } catch (err) {
    console.error("Error decrypting token in getCurrentUser", err);
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
            const units = await getUnits();
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
