
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmailFromDb } from './data';
import type { User as AppUser } from '@/lib/types';


/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: NextAuthOptions = {
  // A estratégia de sessão 'database' é a mais robusta, mas requer um adaptador funcional.
  // Como o adaptador personalizado estava causando o erro, mudamos para 'jwt' como uma correção imediata e estável.
  // Isso armazena a sessão em um JSON Web Token no lado do cliente.
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
          console.error("[NextAuth][Authorize] Error: UID ou email ausente no objeto de credenciais.", { credentials });
          // Retornar null aqui informa ao NextAuth que a autorização falhou, resultando em um erro 'CredentialsSignin'.
          return null;
        }

        try {
          // A autenticação da senha já foi feita no cliente com o Firebase.
          // Aqui, apenas garantimos que o usuário existe no nosso banco de dados KV.
          const appUser = await getUserByEmailFromDb(credentials.email);
          
          if (appUser) {
            // Sucesso! O usuário existe em nosso sistema. Retornamos o objeto de usuário.
            // O NextAuth usará isso para criar o token JWT na callback 'jwt'.
            return appUser;
          }
          
          // Se o usuário autenticou no Firebase mas não está no nosso DB, algo está muito errado.
          console.error(`[NextAuth][Authorize] Error: Usuário autenticado pelo Firebase (${credentials.email}) não foi encontrado no banco de dados do Vercel KV.`);
          return null;
          
        } catch (error) {
          // Qualquer erro de leitura no banco de dados deve impedir o login.
          console.error("[NextAuth][Authorize] Critical Error: Exceção durante a busca do usuário no Vercel KV.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // A callback 'jwt' é chamada sempre que um token é criado ou atualizado.
    // Aqui, injetamos os dados do nosso banco de dados no token.
    async jwt({ token, user }) {
        if (user) {
            const appUser = user as AppUser;
            token.id = appUser.id;
            token.accessLevel = appUser.accessLevel;
            token.role = appUser.role;
            token.subRole = appUser.subRole;
            token.name = appUser.name;
            token.email = appUser.email;
            token.image = appUser.image;
            token.birthdate = appUser.birthdate;
        }
        return token;
    },
    // A callback 'session' é chamada para criar o objeto de sessão do cliente.
    // Ela recebe o token JWT e o transforma no objeto 'session.user'.
    async session({ session, token }) {
        if (session.user) {
            session.user.id = token.id as string;
            session.user.accessLevel = token.accessLevel as AppUser['accessLevel'];
            session.user.role = token.role as AppUser['role'];
            session.user.subRole = token.subRole as AppUser['subRole'];
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.image = token.image as string | null;
            session.user.birthdate = token.birthdate as string | null;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para o login em caso de qualquer erro de auth.
  },
};
