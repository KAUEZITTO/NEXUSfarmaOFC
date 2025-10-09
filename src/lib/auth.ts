
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server'; 
import type { User } from '@/lib/types';
import { getUserByEmailFromDb } from '@/lib/data';

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
          const auth = getAuth(firebaseServerApp); 
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          
          if (firebaseUser) {
            const appUser = await getUserByEmailFromDb(firebaseUser.email!);

            if (!appUser) {
              console.error(`Authorize Error: Usuário autenticado no Firebase, mas não encontrado no banco de dados da aplicação: ${firebaseUser.email}`);
              return null;
            }

            // Retorna o objeto de usuário COMPLETO do nosso banco.
            return {
              id: appUser.id,
              email: appUser.email,
              name: appUser.name,
              image: appUser.image,
              role: appUser.role,
              subRole: appUser.subRole,
              accessLevel: appUser.accessLevel,
              birthdate: appUser.birthdate,
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
    // Agora o callback JWT apenas passa os dados adiante.
    async jwt({ token, user }) {
      // Se 'user' existe (no primeiro login), ele já é o objeto completo do authorize.
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

    // A sessão recebe os dados completos do token.
    async session({ session, token }) {
      if (session.user) {
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
    error: '/login',
  },
};
