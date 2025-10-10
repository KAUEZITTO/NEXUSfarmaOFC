
import type { NextAuthOptions, Awaitable } from 'next-auth';
import type { Adapter, AdapterUser, AdapterSession, AdapterAccount } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from '@/lib/types';
import { getOrCreateUser } from './data';
import { kv } from './kv';

/**
 * Implements a NextAuth.js adapter using Vercel KV.
 * This stores sessions in the database, keeping cookies small.
 */
function KVDriver(client: typeof kv): Adapter {
  const getKey = (prefix: string, id: string) => `${prefix}:${id}`;

  return {
    async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const id = crypto.randomUUID();
      const newUser = { ...user, id };
      await client.set(getKey('user', id), newUser);
      return newUser;
    },
    async getUser(id: string): Promise<AdapterUser | null> {
      return await client.get<AdapterUser>(getKey('user', id));
    },
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      // This is less efficient but necessary for email-based lookups.
      // In a real production app, consider an index.
      const userKeys = [];
      for await (const key of client.scanIterator({ match: 'user:*' })) {
        userKeys.push(key);
      }
      if (userKeys.length === 0) return null;

      const users = await client.mget<AdapterUser[]>(...userKeys);
      return users.find(u => u && u.email === email) || null;
    },
    async getUserByAccount({ providerAccountId, provider }): Promise<AdapterUser | null> {
       const account = await client.get<AdapterAccount>(getKey('account', `${provider}:${providerAccountId}`));
       if (!account) return null;
       return await client.get<AdapterUser>(getKey('user', account.userId));
    },
    async updateUser(user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>): Promise<AdapterUser> {
      const key = getKey('user', user.id);
      const existingUser = await client.get<AdapterUser>(key);
      if (!existingUser) throw new Error("User not found to update.");
      const updatedUser = { ...existingUser, ...user };
      await client.set(key, updatedUser);
      return updatedUser;
    },
    async deleteUser(userId: string): Promise<void> {
      await client.del(getKey('user', userId));
    },
    async linkAccount(account: AdapterAccount): Promise<AdapterAccount> {
      const key = getKey('account', `${account.provider}:${account.providerAccountId}`);
      await client.set(key, account);
      return account;
    },
    async unlinkAccount({ providerAccountId, provider }): Promise<AdapterAccount | undefined> {
      const key = getKey('account', `${provider}:${providerAccountId}`);
      const account = await client.get<AdapterAccount>(key);
      if (account) await client.del(key);
      return account as AdapterAccount | undefined;
    },
    async createSession(session: { sessionToken: string; userId: string; expires: Date }): Promise<AdapterSession> {
      await client.set(getKey('session', session.sessionToken), session, {
          exat: Math.floor(session.expires.getTime() / 1000)
      });
      return session;
    },
    async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
      const session = await client.get<AdapterSession>(getKey('session', sessionToken));
      if (!session) return null;
      const user = await client.get<AdapterUser>(getKey('user', session.userId));
      if (!user) return null;
      return { session, user };
    },
    async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null | undefined> {
        const key = getKey('session', session.sessionToken);
        const existingSession = await client.get<AdapterSession>(key);
        if (!existingSession) return null;
        const updatedSession = { ...existingSession, ...session };
        await client.set(key, updatedSession, { exat: Math.floor(updatedSession.expires.getTime() / 1000) });
        return updatedSession;
    },
    async deleteSession(sessionToken: string): Promise<AdapterSession | null | undefined> {
        const key = getKey('session', sessionToken);
        const session = await client.get<AdapterSession>(key);
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
          const appUser = await getOrCreateUser({
              id: credentials.uid,
              email: credentials.email,
              name: credentials.displayName,
              image: credentials.photoURL,
          });
          
          if (appUser) {
            console.log("Authorize Success: Usuário validado com sucesso.", { email: appUser.email });
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
    // Com a estratégia 'database', o callback 'jwt' não é invocado.
    // O callback 'session' é usado para estender o objeto de sessão.
    async session({ session, user }) {
      // 'user' vem do adaptador de banco de dados.
      // Anexamos o ID e o nível de acesso ao objeto de sessão.
      if (session.user) {
        session.user.id = user.id;
        session.user.accessLevel = user.accessLevel;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
        session.user.birthdate = user.birthdate;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, mostrando a mensagem.
  },
};
