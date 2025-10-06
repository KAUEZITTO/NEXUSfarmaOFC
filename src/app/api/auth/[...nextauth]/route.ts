
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
import * as jose from 'jose';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import type { JWT } from 'next-auth/jwt';

// Função auxiliar para buscar um usuário no nosso banco de dados (Vercel KV)
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
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
        
        const auth = getAuth(firebaseApp);

        try {
            // 1. Authenticate with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
            const firebaseUser = userCredential.user;

            if (firebaseUser) {
                // 2. Fetch additional user data from our Vercel KV database
                const appUser = await getUserFromDb(firebaseUser.email);
                
                if (appUser) {
                     // 3. Return a minimal user object for the JWT.
                     // The session callback will populate the rest.
                     return {
                        id: appUser.id,
                        email: appUser.email,
                    };
                }
            }
            // If user is not found in either Firebase or our DB, return null
            return null;

        } catch (error) {
            console.error("Firebase authentication error:", error);
            // This will catch errors like wrong password, user not found, etc.
            return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // No login inicial, o 'user' vem da função 'authorize'.
      if (user) {
        token.id = user.id;
        // O email já é adicionado por padrão.
      }

      // Se a sessão for atualizada (ex: mudança de perfil), o 'session' é passado.
      // O NextAuth tenta mesclar a sessão no token, o que pode incluir a imagem grande.
      // Aqui, garantimos que o token permaneça limpo.
      if (trigger === "update" && session) {
        // NÃO mesclar a sessão completa. Apenas atualize o que for necessário,
        // mas como já buscamos os dados no callback 'session', não precisamos fazer nada aqui.
      }
      
      // Limpeza final: garante que apenas os dados essenciais permaneçam no token.
      const minimalToken: JWT = {
        id: token.id,
        email: token.email,
        sub: token.sub,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti
      };
      
      return minimalToken;
    },

    async session({ session, token }: { session: any, token: JWT }) {
        if (token && session.user) {
            // Com o token limpo (apenas com ID/email), buscamos os dados completos do DB.
            const appUser = await getUserFromDb(token.email);
            
            if (appUser) {
                // Populamos o objeto 'session.user' que será usado no cliente.
                session.user.id = appUser.id;
                session.user.name = appUser.name;
                session.user.image = appUser.image;
                session.user.birthdate = appUser.birthdate;
                session.user.role = appUser.role;
                session.user.subRole = appUser.subRole;
                session.user.accessLevel = appUser.accessLevel;
                
                // Atualiza 'lastSeen' no KV store sem colocar no cookie da sessão.
                const users = await readData<User>('users');
                const userIndex = users.findIndex(u => u.id === appUser.id);
                if (userIndex !== -1) {
                    users[userIndex].lastSeen = new Date().toISOString();
                    await writeData('users', users);
                    // Opcional: adicionar ao objeto de sessão se precisar no cliente
                    session.user.lastSeen = users[userIndex].lastSeen;
                }
            }
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
