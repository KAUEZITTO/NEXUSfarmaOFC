

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { getUserByEmailFromDb } from '@/lib/data';

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
          return null; // Retorna nulo se as credenciais essenciais não forem fornecidas.
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
