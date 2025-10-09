

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server'; // Corrigido para usar a instância do servidor
import { getOrCreateFirebaseUser } from '@/lib/actions';
import { getUserByEmailFromDb } from '@/lib/data';
import type { User } from '@/lib/types';

// Garante que a rota de API nunca seja pré-renderizada estaticamente
export const dynamic = 'force-dynamic';

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

          // Busca o usuário no nosso banco para popular o objeto inicial
          // A fonte da verdade para permissões será o callback JWT.
          const appUser = await getUserByEmailFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`CRITICAL: User ${firebaseUser.email} authenticated with Firebase but not found in the application database.`);
            // Retorna o mínimo necessário para o callback JWT funcionar
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
            };
          }
          
          // Retorna o usuário do nosso banco para o próximo passo
          return appUser;

        } catch (error: any) {
          console.error("Authorize Error: Falha na autenticação com Firebase.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          return null; // Indica "Credenciais Inválidas" para o NextAuth
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      return true;
    },
    
    async jwt({ token, user }) {
      // Este callback é a fonte da verdade para os dados da sessão.
      // Ele é chamado após o login e a cada verificação de sessão.
      // Aqui é seguro chamar o banco de dados.
      
      // Se o objeto 'user' do authorize estiver presente, significa que é o login inicial.
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
      // A cada carregamento de página, popula a sessão com os dados do token JWT.
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
