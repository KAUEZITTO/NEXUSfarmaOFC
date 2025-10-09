
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server';
import { getUserByEmailFromDb } from '@/lib/data';
import type { User } from '@/lib/types';

/**
 * Opções de configuração para o NextAuth.js.
 * Esta configuração é mantida em um arquivo separado para evitar problemas
 * de build com o Next.js App Router, garantindo que a lógica complexa
 * e as chamadas ao banco de dados não sejam analisadas durante o build estático.
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
          if (!firebaseUser?.email) {
             return null;
          }
          
          // CRITICAL CHANGE: DO NOT fetch from our DB here.
          // Only return the basic user from Firebase. The JWT callback will enrich it.
          // This prevents the build from failing.
          return {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            image: firebaseUser.photoURL,
          };

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
    async signIn({ user, account }) {
      if (user) {
        return true;
      }
      return false;
    },
    
    async jwt({ token, user }) {
      // On initial sign-in, the user object is available.
      // We now fetch from our DB here to enrich the token.
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
        } else {
          // This case should ideally not happen if user registration is enforced.
          // But as a fallback, we use the Firebase user data.
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.image = user.image;
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
