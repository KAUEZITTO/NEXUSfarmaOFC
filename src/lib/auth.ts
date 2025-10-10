
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

        // Importações dinâmicas para evitar erros de build e usar o SDK cliente
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
          // 1. Autenticar com o Firebase.
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          
          if (userCredential.user) {
              // 2. Buscar o usuário em nosso DB.
              const appUser = await getUserByEmailFromDb(credentials.email);

              if (appUser) {
                // Usuário existe em ambos os lugares, retorna o perfil completo.
                return appUser;
              } else {
                // *** CORREÇÃO CRÍTICA ***
                // Usuário autenticou no Firebase mas não existe no nosso DB.
                // Não falhe. Retorne os dados básicos para o callback JWT criar o perfil.
                console.warn(`User ${credentials.email} authenticated with Firebase but not found in app DB. Profile will be created.`);
                return {
                  id: userCredential.user.uid,
                  email: userCredential.user.email,
                  name: userCredential.user.displayName
                };
              }
          }
          return null;
        } catch (error: any) {
          console.error("Authorize Error (signInWithEmailAndPassword failed):", error.code);
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

            // Se o usuário veio completo do 'authorize' (já existia no DB)
            if ('accessLevel' in user) {
                token.name = user.name;
                token.image = user.image;
                token.role = user.role;
                token.subRole = user.subRole;
                token.accessLevel = user.accessLevel;
                token.birthdate = user.birthdate;
            }
        }
        
        // Se o token ainda não tem 'accessLevel', significa que o perfil precisa ser criado/buscado.
        if (token.id && !token.accessLevel) {
            const { getOrCreateUser } = await import('@/lib/data');
            const appUser = await getOrCreateUser(token.id, token.email!, token.name);
            if (appUser) {
                token.name = appUser.name;
                token.image = appUser.image;
                token.role = appUser.role;
                token.subRole = appUser.subRole;
                token.accessLevel = appUser.accessLevel;
                token.birthdate = appUser.birthdate;
            }
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
