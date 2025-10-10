
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getOrCreateUser } from './data';
import { Adapter } from 'next-auth/adapters';
import { kv } from './kv';
import type { User as AppUser } from '@/lib/types';


/**
 * Implements a NextAuth.js adapter using Vercel KV.
 * This stores sessions in the database, keeping cookies small.
 */
function KVDriver(client: typeof kv): Adapter {
  return {
    async createUser(user) {
      const id = crypto.randomUUID();
      const newUser = { ...user, id };
      await client.set(`user:${id}`, newUser);
      return newUser;
    },
    async getUser(id) {
      const user = await client.get<AppUser>(`user:${id}`);
      return user ? { ...user, emailVerified: null } : null;
    },
    async getUserByEmail(email) {
      // This is less efficient but necessary for email-based lookups.
      const userKeys: string[] = [];
      for await (const key of client.scanIterator({ match: 'user:*' })) {
        userKeys.push(key);
      }
      if (userKeys.length === 0) return null;
      const users = await client.mget<AppUser[]>(...userKeys);
      const user = users.find(u => u?.email === email);
      return user ? { ...user, emailVerified: null } : null;
    },
    async getUserByAccount({ providerAccountId, provider }) {
       const account = await client.get<any>(`account:${provider}:${providerAccountId}`);
       if (!account) return null;
       const user = await client.get<AppUser>(`user:${account.userId}`);
       return user ? { ...user, emailVerified: null } : null;
    },
    async updateUser(user) {
      const key = `user:${user.id}`;
      const existingUser = await client.get<AppUser>(key);
      if (!existingUser) throw new Error("User not found to update.");
      const updatedUser = { ...existingUser, ...user };
      await client.set(key, updatedUser);
      return { ...updatedUser, emailVerified: null };
    },
    async deleteUser(userId) {
      await client.del(`user:${userId}`);
    },
    async linkAccount(account) {
      const key = `account:${account.provider}:${account.providerAccountId}`;
      await client.set(key, account);
      return account;
    },
    async unlinkAccount({ providerAccountId, provider }) {
      const key = `account:${provider}:${providerAccountId}`;
      const account = await client.get<any>(key);
      if (account) await client.del(key);
      return account;
    },
    async createSession({ sessionToken, userId, expires }) {
      await client.set(`session:${sessionToken}`, { sessionToken, userId, expires }, {
          exat: Math.floor(expires.getTime() / 1000)
      });
      return { sessionToken, userId, expires };
    },
    async getSessionAndUser(sessionToken) {
      const session = await client.get<any>(`session:${sessionToken}`);
      if (!session) return null;
      const user = await client.get<AppUser>(`user:${session.userId}`);
      if (!user) return null;
      return { session, user: { ...user, emailVerified: null } };
    },
    async updateSession(session) {
        const key = `session:${session.sessionToken}`;
        const existingSession = await client.get<any>(key);
        if (!existingSession) return null;
        const updatedSession = { ...existingSession, ...session };
        await client.set(key, updatedSession, { exat: Math.floor(updatedSession.expires.getTime() / 1000) });
        return updatedSession;
    },
    async deleteSession(sessionToken) {
        const key = `session:${sessionToken}`;
        const session = await client.get<any>(key);
        if (session) await client.del(key);
        return session;
    },
  };
}


/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: NextAuthOptions = {
  adapter: KVDriver(kv),
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
        displayName: { label: "Name", type: "text" },
        photoURL: { label: "Photo URL", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("Authorize Error: UID ou email ausente no objeto de credenciais.", { credentials });
          return null;
        }

        try {
          // getOrCreateUser is safe as it only interacts with Vercel KV, not Firebase Admin.
          const appUser = await getOrCreateUser({
              id: credentials.uid,
              email: credentials.email,
              name: credentials.displayName,
              image: credentials.photoURL,
          });
          
          if (appUser) {
            return appUser;
          }

          console.error("Authorize Error: A função getOrCreateUser retornou null.", { credentials });
          return null;
          
        } catch (error) {
          console.error("Authorize Critical Error: Exceção durante a chamada getOrCreateUser.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
        if (session.user) {
            const dbUser = user as AppUser;
            session.user.id = dbUser.id;
            session.user.accessLevel = dbUser.accessLevel;
            session.user.name = dbUser.name;
            session.user.email = dbUser.email;
            session.user.image = dbUser.image;
            session.user.birthdate = dbUser.birthdate;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
