
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@/lib/types';

// NENHUMA importação estática de pacotes do servidor aqui.

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
        // Agora esperamos o objeto do usuário do Firebase, não mais email/senha.
        // O NextAuth usará isso para passar os dados para 'authorize'.
      },
      async authorize(credentials) {
        // As 'credentials' aqui são na verdade o objeto do usuário do Firebase
        // que passamos do formulário de login após um login bem-sucedido.
        if (!credentials?.uid || !credentials?.email) {
          console.error("Authorize: Faltando UID ou email do Firebase.");
          return null;
        }

        try {
          // Importa a função de dados dinamicamente para evitar erro de build
          const { getOrCreateUser } = await import('@/lib/data');

          // Busca ou cria o usuário em nosso banco de dados (Vercel KV)
          // usando os dados já validados do Firebase.
          const appUser = await getOrCreateUser(
            credentials.uid,
            credentials.email,
            credentials.displayName,
            credentials.photoURL
          );

          if (appUser) {
            // Se o usuário foi encontrado ou criado com sucesso, retorne-o.
            return appUser;
          }

          console.error("Authorize: Falha ao obter ou criar o usuário do aplicativo.");
          return null;
          
        } catch (error) {
          console.error("Authorize: Erro crítico durante getOrCreateUser.", error);
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
