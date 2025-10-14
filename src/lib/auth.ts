
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
          console.error("[NextAuth][Authorize] Error: UID or email missing in credentials.");
          return null;
        }
        
        // A validação de senha já ocorreu no cliente com o Firebase.
        // Aqui, apenas passamos os dados para a próxima etapa se as credenciais existirem.
        // A busca no banco de dados será feita no callback 'jwt'.
        return {
          id: credentials.uid,
          email: credentials.email,
        } as AppUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // Se 'user' existe (no primeiro login), buscamos os dados completos do nosso banco de dados.
        if (user && user.email) {
            const appUser = await getUserByEmailFromDb(user.email);
            if (appUser) {
                token.id = appUser.id;
                token.accessLevel = appUser.accessLevel;
                token.role = appUser.role;
                token.subRole = appUser.subRole;
                token.name = appUser.name;
                token.image = appUser.image;
                token.birthdate = appUser.birthdate;
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
            session.user.image = token.image;
            session.user.birthdate = token.birthdate;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
