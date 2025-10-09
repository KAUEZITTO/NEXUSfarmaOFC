
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server'; 
import type { User } from '@/lib/types';
import { getUserByEmailFromDb } from '@/lib/data';

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
          return null;
        }

        try {
          // 1. Autenticar com o Firebase
          const auth = getAuth(firebaseServerApp); 
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          
          if (firebaseUser) {
            // 2. Após sucesso no Firebase, buscar no nosso banco de dados.
            const appUser = await getUserByEmailFromDb(firebaseUser.email!);

            // 3. Se o usuário não existir no nosso banco, o login falha.
            // Isso força a consistência dos dados. O usuário deve ser criado pelo fluxo de registro.
            if (!appUser) {
              console.error(`Login Failure: User ${firebaseUser.email} authenticated with Firebase but does not exist in the app database.`);
              return null;
            }

            // 4. Se tudo estiver correto, retorna o perfil completo do nosso banco.
            return appUser;
          }

          return null;

        } catch (error: any) {
          console.error("Authorize Error: Firebase sign-in failed.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          // Se o signIn do Firebase falhar, a credencial está errada.
          return null; 
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // No login inicial (objeto 'user' está presente)
        if (user) {
            // O 'user' que vem do 'authorize' já é o perfil completo do nosso banco.
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
