

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser, AccessLevel, User } from '@/lib/types';
import { readData, writeData } from '@/lib/data';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 * Esta função agora vive em `auth.ts` para quebrar ciclos de dependência.
 */
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    return null;
  }
}

/**
 * Options for NextAuth.js configuration.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("[NextAuth][Authorize] Error: UID ou email ausente nas credenciais.");
          return null;
        }
        
        const userFromDb = await getUserByEmailFromDb(credentials.email);

        if (!userFromDb) {
            console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} não encontrado no banco de dados.`);
            return null; 
        }

        return {
          id: credentials.uid,
          email: userFromDb.email,
        } as AppUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        if (user && user.email) {
            const appUser = await getUserByEmailFromDb(user.email);
            if (appUser) {
                token.id = appUser.id;
                token.accessLevel = appUser.accessLevel;
                token.role = appUser.role;
                token.subRole = appUser.subRole;
                token.name = appUser.name;
                token.birthdate = appUser.birthdate;
                token.avatarColor = appUser.avatarColor;
            }
        }
        
        if (trigger === "update" && session?.user) {
            const appUser = await getUserByEmailFromDb(session.user.email as string);
            if (appUser) {
                token.id = appUser.id;
                token.accessLevel = appUser.accessLevel;
                token.role = appUser.role;
                token.subRole = appUser.subRole;
                token.name = appUser.name;
                token.birthdate = appUser.birthdate;
                token.avatarColor = appUser.avatarColor;
            }
        }
        
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            session.user.id = token.id as string;
            session.user.accessLevel = token.accessLevel as AppUser['accessLevel'];
            session.user.role = token.role as AppUser['role'];
            session.user.subRole = token.subRole as AppUser['subRole'];
            session.user.name = token.name;
            session.user.birthdate = token.birthdate;
            session.user.avatarColor = token.avatarColor as string;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};


// --- USER MANAGEMENT ACTIONS ---
export async function updateUserAccessLevel(userId: string, accessLevel: AccessLevel) {
    'use server';
    const users = await readData<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    users[userIndex].accessLevel = accessLevel;
    await writeData('users', users);
    revalidatePath('/dashboard/user-management');
}

export async function deleteUser(userId: string) {
    'use server';
    const adminAuth = getAuth(getAdminApp());
    const users = await readData<User>('users');
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
         throw new Error('Usuário não encontrado para exclusão.');
    }

    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            console.error("Erro ao excluir usuário do Firebase Auth:", error);
            throw new Error('Erro ao excluir usuário do sistema de autenticação.');
        }
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    await writeData('users', updatedUsers);
    revalidatePath('/dashboard/user-management');
}
