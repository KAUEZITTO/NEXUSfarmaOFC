
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
          // A lógica agora é simples: confiar nos dados já validados pelo cliente
          // e garantir que o perfil do usuário exista no nosso banco de dados.
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
    async jwt({ token, user, trigger, session }) {
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
        
         // Se o gatilho da atualização for 'update' e houver uma sessão, atualize o token
        if (trigger === "update" && session) {
            return { ...token, ...session.user };
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
