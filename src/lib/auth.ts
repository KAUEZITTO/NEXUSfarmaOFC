
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
      // No login inicial, o objeto 'user' está disponível.
      // Populamos o token com os dados mínimos necessários.
      if (user) {
        return {
          id: user.id,
          accessLevel: user.accessLevel,
          email: user.email,
          name: user.name,
          image: user.image,
          birthdate: user.birthdate,
        };
      }
      // Em requisições subsequentes, o token já existe.
      // Apenas o retornamos para garantir que ele não seja modificado ou inflado.
      return token;
    },

    async session({ session, token }) {
      // A sessão do cliente é populada a partir do nosso token JWT minimalista.
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accessLevel = token.accessLevel as User['accessLevel'];
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.birthdate = token.birthdate;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, mostrando a mensagem.
  },
};
