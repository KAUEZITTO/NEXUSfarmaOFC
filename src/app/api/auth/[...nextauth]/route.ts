
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
                     // 3. Return the combined user object for the session
                     return {
                        id: appUser.id,
                        email: appUser.email,
                        name: appUser.name,
                        image: appUser.image,
                        birthdate: appUser.birthdate,
                        role: appUser.role,
                        accessLevel: appUser.accessLevel,
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
        // Handle session updates (e.g., from profile changes)
        if (trigger === "update" && session) {
            return { ...token, ...session };
        }

        // On initial sign-in, populate the token with data from our DB
        if (user) {
            const appUser = await getUserFromDb(user.email);
            if (appUser) {
                token.id = appUser.id;
                token.name = appUser.name;
                token.image = appUser.image;
                token.birthdate = appUser.birthdate;
                token.role = appUser.role;
                token.accessLevel = appUser.accessLevel;
                token.lastSeen = new Date().toISOString();
            }
        }
        return token;
    },

    async session({ session, token }: { session: any, token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.birthdate = token.birthdate;
        session.user.role = token.role;
        session.user.accessLevel = token.accessLevel;
        
        // Update lastSeen in KV store
        const users = await readData<User>('users');
        const userIndex = users.findIndex(u => u.id === token.id);
        if (userIndex !== -1) {
            users[userIndex].lastSeen = new Date().toISOString();
            await writeData('users', users);
            session.user.lastSeen = users[userIndex].lastSeen;
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
