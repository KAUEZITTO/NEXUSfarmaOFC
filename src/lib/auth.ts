
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@/lib/types';
import { getOrCreateUser } from './data';


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
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
        displayName: { label: "Name", type: "text" },
        photoURL: { label: "Photo URL", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("Authorize Error: UID ou email ausente no objeto de credenciais.", { credentials });
          return null;
        }

        try {
          const appUser = await getOrCreateUser({
              id: credentials.uid,
              email: credentials.email,
              name: credentials.displayName,
              image: credentials.photoURL,
          });
          
          if (appUser) {
            console.log("Authorize Success: Usuário validado com sucesso.", { email: appUser.email });
            return appUser;
          }

          console.error("Authorize Error: A função getOrCreateUser retornou null.", { credentials });
          return null;
          
        } catch (error) {
          console.error("Authorize Critical Error: Exceção durante a chamada getOrCreateUser.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // Na primeira vez que o JWT é criado (após o login), o objeto 'user' está disponível.
        if (user) {
            // Persistimos apenas o ID, email e nível de acesso no token.
            token.id = user.id;
            token.accessLevel = user.accessLevel;
            token.email = user.email; 
        }
        return token;
    },

    async session({ session, token }) {
      // O token JWT é passado para o callback de sessão.
      // Populamos a sessão do cliente com os dados mínimos do token.
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.accessLevel = token.accessLevel as User['accessLevel'];
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, mostrando a mensagem.
  },
};
