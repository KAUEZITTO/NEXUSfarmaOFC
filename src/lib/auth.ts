
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server'; 
import type { User } from '@/lib/types';
// A importação estática de 'getUserByEmailFromDb' é removida para evitar o erro de build.

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
          const auth = getAuth(firebaseServerApp); 
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          
          if (firebaseUser) {
            // Importa dinamicamente a função de busca de dados para evitar o erro de build.
            const { getUserByEmailFromDb } = await import('@/lib/data');
            const appUser = await getUserByEmailFromDb(firebaseUser.email!);

            if (!appUser) {
              // Se o usuário existe no Firebase mas não no nosso DB, o login não deve falhar.
              // O callback JWT irá lidar com a criação do usuário no nosso DB.
              console.warn(`Login Warning: User ${firebaseUser.email} authenticated with Firebase but not found in app DB. Will create profile in JWT callback.`);
              return {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                image: firebaseUser.photoURL,
              } as User; // Retorna os dados básicos do Firebase
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
    // Agora o callback JWT passa todos os dados adiante novamente.
    async jwt({ token, user, account }) {
        // No login inicial (objeto 'user' está presente)
        if (user) {
            token.id = user.id;
            token.email = user.email;
            token.name = user.name;
            token.image = user.image;

            // Se o usuário veio do 'authorize' e não tinha dados de role/accessLevel,
            // significa que ele não existia no nosso banco. Vamos criá-lo agora.
            if (!user.accessLevel) {
                const { getOrCreateFirebaseUser } = await import('@/lib/actions');
                console.log(`JWT Callback: Creating profile for user ${user.email}`);
                const fullAppUser = await getOrCreateFirebaseUser(user.email!, user.name, user.image);
                token.role = fullAppUser.role;
                token.subRole = fullAppUser.subRole;
                token.accessLevel = fullAppUser.accessLevel;
                token.birthdate = fullAppUser.birthdate;
            } else {
                // O usuário já veio completo do 'authorize'
                token.role = user.role;
                token.subRole = user.subRole;
                token.accessLevel = user.accessLevel;
                token.birthdate = user.birthdate;
            }
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
