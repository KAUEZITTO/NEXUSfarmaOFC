
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
  if (!email) return null;
  const users = await readData<User>('users');
  return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(kv),
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
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

        const auth = getAuth(firebaseApp);

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const firebaseUser = userCredential.user;

          if (!firebaseUser) return null;

          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`User ${firebaseUser.email} authenticated with Firebase but not found in app DB.`);
            return null;
          }
          
          return appUser;

        } catch (error) {
          console.error("Firebase authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.subRole = user.subRole;
        session.user.accessLevel = user.accessLevel;
        session.user.image = user.image;
        session.user.birthdate = user.birthdate;
        session.user.name = user.name;
        session.user.email = user.email;
        
        const users = await readData<User>('users');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex].lastSeen = new Date().toISOString();
          writeData('users', users).catch(console.error);
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
