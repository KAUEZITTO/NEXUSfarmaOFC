
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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Authorize: Missing credentials.");
          return null;
        }

        // Importações dinâmicas para evitar erros de build e usar o SDK cliente que é mais estável neste ambiente
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
        const { getUserByEmailFromDb } = await import('@/lib/data');

        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);

        try {
          // 1. Autenticar com o Firebase. Se isso falhar, uma exceção será lançada.
          await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          
          // 2. Se a autenticação acima foi bem-sucedida, buscar o usuário em nosso DB
          const appUser = await getUserByEmailFromDb(credentials.email);

          if (appUser) {
            // Se o usuário existe, retorna o perfil completo do nosso banco.
            return appUser;
          } else {
            // Se autenticou no Firebase mas não existe no nosso DB, nega o login.
            console.error(`Login Failure: User ${credentials.email} authenticated with Firebase but does not exist in the app database.`);
            return null;
          }
        } catch (error: any) {
          // signInWithEmailAndPassword falhou (senha errada, usuário não encontrado no Firebase, etc.)
          console.error("Authorize Error (signInWithEmailAndPassword failed):", error.code);
          return null; 
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
