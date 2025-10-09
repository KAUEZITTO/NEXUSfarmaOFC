
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server'; 
import type { User } from '@/lib/types';
import { adminAuth } from './firebase/admin';

/**
 * Opções de configuração para o NextAuth.js.
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
          console.log("Authorize: Missing credentials.");
          return null;
        }

        try {
          // A grande mudança: Não usamos mais signInWithEmailAndPassword aqui.
          // Apenas verificamos se o usuário existe no Firebase e no nosso DB.
          // O `signIn` do NextAuth no lado do cliente já valida a senha contra o Firebase.

          // 1. Verificar se o usuário existe no Firebase Auth
          await adminAuth.getUserByEmail(credentials.email);
          
          // 2. Se existir no Firebase, verificar se existe no nosso banco de dados.
          const { getUserByEmailFromDb } = await import('@/lib/data');
          const appUser = await getUserByEmailFromDb(credentials.email);

          if (appUser) {
            // Se o usuário existe em ambos, a autorização é bem-sucedida.
            // Retornamos o perfil completo do nosso banco.
            return appUser;
          } else {
            // Existe no Firebase, mas não no nosso banco. Nega o login.
            console.error(`Login Failure: User ${credentials.email} exists in Firebase but not in the app database.`);
            return null;
          }
        } catch (error: any) {
          // Se adminAuth.getUserByEmail falhar, o usuário não existe no Firebase.
          if (error.code === 'auth/user-not-found') {
            console.log(`Authorize: User ${credentials.email} not found in Firebase.`);
          } else {
            console.error("Authorize Error:", error);
          }
          return null; 
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // No login inicial (objeto 'user' está presente)
        if (user) {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.image = user.image;
            token.role = user.role;
            token.subRole = user.subRole;
            token.accessLevel = user.accessLevel;
            token.birthdate = user.birthdate;
        }
        return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as User['role'];
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.accessLevel = token.accessLevel as User['accessLevel'];
        session.user.image = token.image as string | undefined;
        session.user.birthdate = token.birthdate as string | undefined;
        session.user.subRole = token.subRole as User['subRole'];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, mostrando a mensagem.
  },
};
