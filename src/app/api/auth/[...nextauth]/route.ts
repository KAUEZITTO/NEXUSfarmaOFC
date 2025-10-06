
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
import * as jose from 'jose';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import type { JWT } from 'next-auth/jwt';
import { kv } from "@/lib/kv";
import { VercelKVAdapter } from "@auth/vercel-kv-adapter";

// Função auxiliar para buscar um usuário no nosso banco de dados (Vercel KV)
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  // Use Vercel KV to store session data.
  // This keeps the cookie small, containing only a session ID.
  adapter: VercelKVAdapter(kv),
  session: {
    // Use "database" strategy to store sessions in Vercel KV.
    strategy: 'database',
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
                     // 3. Return the full user object. NextAuth adapter will handle creating the session.
                     return {
                        id: appUser.id,
                        email: appUser.email,
                        name: appUser.name,
                        image: appUser.image,
                        birthdate: appUser.birthdate,
                        role: appUser.role,
                        subRole: appUser.subRole,
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
    // The session callback is still useful for adding custom data to the session object
    // that is available on the client.
    async session({ session, user }) {
        if (user && session.user) {
            // With the database strategy, the `user` object is the full user from the DB.
            const appUser = await getUserFromDb(user.email);
            
            if (appUser) {
                // Populate the 'session.user' object with all necessary fields.
                session.user.id = appUser.id;
                session.user.name = appUser.name;
                session.user.image = appUser.image;
                session.user.birthdate = appUser.birthdate;
                session.user.role = appUser.role;
                session.user.subRole = appUser.subRole;
                session.user.accessLevel = appUser.accessLevel;
                
                // Update 'lastSeen' in the KV store without putting it in the session object.
                const users = await readData<User>('users');
                const userIndex = users.findIndex(u => u.id === appUser.id);
                if (userIndex !== -1) {
                    users[userIndex].lastSeen = new Date().toISOString();
                    await writeData('users', users);
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
