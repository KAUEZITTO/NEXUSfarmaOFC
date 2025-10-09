
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client'; // MUDANÇA CRÍTICA: Usando o app do cliente aqui
import { getUserByEmailFromDb } from '@/lib/data';
import type { User } from '@/lib/types';

/**
 * Opções de configuração para o NextAuth.js.
 * Esta configuração é mantida em um arquivo separado para evitar problemas
 * de build com o Next.js App Router.
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
          // Usa o SDK do CLIENTE para verificar as credenciais, pois é isso que o authorize simula.
          const auth = getAuth(firebaseApp); 
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          
          // O 'authorize' SÓ retorna os dados básicos do Firebase.
          // O callback 'jwt' vai enriquecer com os dados do nosso banco.
          // Isso quebra a dependência de build.
          if (firebaseUser) {
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              image: firebaseUser.photoURL,
            };
          }

          return null;

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
    async signIn({ user }) {
      if (user) {
        return true;
      }
      return false;
    },
    
    // Este callback é o lugar correto para buscar dados do seu banco de dados.
    async jwt({ token, user }) {
      // Na primeira vez que o usuário loga, o objeto 'user' do authorize está disponível.
      if (user && user.email) {
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
