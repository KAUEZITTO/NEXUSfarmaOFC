
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
      // The `user` object is only passed on the initial sign-in.
      if (user) {
        token.id = user.id;
        // The email is already included by default.
      }

      // No matter what happens (initial login, session update), we ensure
      // the token only contains the bare minimum. This is the definitive fix
      // for REQUEST_HEADER_TOO_LARGE.
      const minimalToken: JWT = {
        id: token.id,
        email: token.email,
        // The following are standard JWT claims that NextAuth uses.
        sub: token.sub,
        iat: token.iat,
        exp: token.exp,
        jti: token.jti
      };
      
      return minimalToken;
    },

    async session({ session, token }: { session: any, token: JWT }) {
        if (token && session.user) {
            // With the clean token (only ID/email), we always fetch the full data from the DB.
            const appUser = await getUserFromDb(token.email);
            
            if (appUser) {
                // Populate the 'session.user' object that will be used on the client.
                session.user.id = appUser.id;
                session.user.name = appUser.name;
                session.user.image = appUser.image;
                session.user.birthdate = appUser.birthdate;
                session.user.role = appUser.role;
                session.user.subRole = appUser.subRole;
                session.user.accessLevel = appUser.accessLevel;
                
                // Update 'lastSeen' in the KV store without putting it in the session cookie.
                const users = await readData<User>('users');
                const userIndex = users.findIndex(u => u.id === appUser.id);
                if (userIndex !== -1) {
                    users[userIndex].lastSeen = new Date().toISOString();
                    await writeData('users', users);
                    // Optional: add to the session object if needed on the client,
                    // but it won't be in the cookie.
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
