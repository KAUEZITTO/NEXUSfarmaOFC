

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser, UserLocation } from '@/lib/types';
import { readData } from '@/lib/data';

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
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

        // Hardcoded admin override
        if (userFromDb.email === 'kauemoreiraofc2@gmail.com') {
          userFromDb.accessLevel = 'Admin';
          userFromDb.subRole = 'Coordenador';
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
            let appUser = await getUserByEmailFromDb(user.email);
            if (appUser) {
                 // Hardcoded admin override on session creation
                if (appUser.email === 'kauemoreiraofc2@gmail.com') {
                    token.accessLevel = 'Admin';
                    token.subRole = 'Coordenador';
                } else {
                    token.accessLevel = appUser.accessLevel;
                    token.subRole = appUser.subRole;
                }

                token.id = appUser.id;
                token.location = appUser.location;
                token.role = appUser.role;
                token.name = appUser.name;
                token.birthdate = appUser.birthdate;
                token.avatarColor = appUser.avatarColor;
            }
        }
        
        if (trigger === "update" && session?.user) {
            const appUser = await getUserByEmailFromDb(session.user.email as string);
            if (appUser) {
                token.id = appUser.id;
                token.location = appUser.location;
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
            session.user.location = token.location as UserLocation;
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
