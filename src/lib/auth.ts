
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
        
        // **CORREÇÃO**: Verifica se o usuário existe no banco de dados (Vercel KV)
        // antes de prosseguir. A senha já foi validada pelo Firebase no cliente.
        const userFromDb = await getUserByEmailFromDb(credentials.email);

        if (!userFromDb) {
            console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} não encontrado no banco de dados.`);
            return null; // Usuário autenticado no Firebase, mas não existe no nosso sistema. Nega o login.
        }

        // Se o usuário existe, retorna o objeto para ser usado no callback JWT.
        // Usamos o ID do Firebase que veio das credenciais para garantir consistência.
        return {
          id: credentials.uid,
          email: userFromDb.email,
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
