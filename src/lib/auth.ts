import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server';
import { getUserByEmailFromDb } from '@/lib/data';
import type { User } from '@/lib/types';

/**
 * Opções de configuração para o NextAuth.js.
 * Esta configuração é mantida em um arquivo separado para evitar problemas
 * de build com o Next.js App Router, garantindo que a lógica complexa
 * e as chamadas ao banco de dados não sejam analisadas durante o build estático.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const auth = getAuth(firebaseServerApp);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          if (!firebaseUser?.email) {
             return null;
          }

          const appUser = await getUserByEmailFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`CRITICAL: User ${firebaseUser.email} authenticated with Firebase but not found in the application database.`);
            // Retorna o mínimo necessário para o callback JWT funcionar,
            // caso o usuário exista no Firebase mas não no seu banco.
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
            };
          }
          
          return appUser;

        } catch (error: any) {
          console.error("Authorize Error: Falha na autenticação com Firebase.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    
    async jwt({ token, user }) {
      // Este callback é chamado após o login e a cada verificação de sessão.
      // Se o objeto 'user' do authorize estiver presente, significa que é o login inicial.
      // Aqui é seguro buscar os dados do seu banco de dados (Vercel KV).
      if (user?.email) {
          const appUser = await getUserByEmailFromDb(user.email);
          if (appUser) {
              token.id = appUser.id;
              token.role = appUser.role;
              token.name = appUser.name;
              token.email = appUser.email;
              token.accessLevel = appUser.accessLevel;
              token.image = appUser.image;
              token.birthdate = appUser.birthdate;
          }
      }
      return token;
    },

    async session({ session, token }) {
      // Popula o objeto `session.user` com os dados do token JWT.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as User['role'];
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.accessLevel = token.accessLevel as User['accessLevel'];
        session.user.image = token.image as string | undefined;
        session.user.birthdate = token.birthdate as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
