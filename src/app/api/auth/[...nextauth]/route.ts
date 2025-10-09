

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

          // Se a autenticação do Firebase foi bem-sucedida, nós CONFIAMOS nela.
          // Buscamos o usuário em nosso banco de dados para obter dados adicionais (role, accessLevel).
          const appUser = await getUserByEmailFromDb(firebaseUser.email);
          
          // Se o usuário não for encontrado em nosso banco de dados, isso é um estado inconsistente,
          // mas não devemos bloquear o login. Retornamos os dados básicos do Firebase.
          if (!appUser) {
            console.error(`CRITICAL: User ${firebaseUser.email} authenticated with Firebase but not found in the application database.`);
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              role: 'Farmacêutico', // Role padrão de fallback
              accessLevel: 'User',   // Nível de acesso padrão de fallback
            };
          }
          
          // Retornamos o objeto de usuário completo do nosso banco de dados.
          // Isso garante que a sessão seja criada com todas as informações corretas.
          return appUser;

        } catch (error: any) {
          // A única vez que isso deve falhar é se a senha estiver realmente errada no Firebase.
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
      // Para o fluxo de credenciais, a função `authorize` já fez todo o trabalho.
      return true;
    },
    
    async jwt({ token, user }) {
      // No primeiro login (objeto 'user' está presente), enriquece o token.
      if (user) {
        // Para garantir consistência, buscamos o usuário mais recente do banco.
        const appUser = await getUserByEmailFromDb(user.email!);
        if (appUser) {
            token.id = appUser.id;
            token.role = appUser.role;
            token.name = appUser.name;
            token.email = appUser.email;
            token.accessLevel = appUser.accessLevel;
            token.image = appUser.image;
            token.birthdate = appUser.birthdate;
        } else {
            // Fallback para o usuário que veio do `authorize` ou `signIn`
            token.id = user.id;
            token.role = (user as User).role || 'Farmacêutico';
            token.accessLevel = (user as User).accessLevel || 'User';
        }
      }
      return token;
    },

    async session({ session, token }) {
      // A cada carregamento de página, popula a sessão com os dados do token JWT.
      if (session.user && token) {
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
