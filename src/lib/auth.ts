
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmailFromDb } from './data';
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
      const id = user.id || crypto.randomUUID();
      const newUser = { ...user, id };
      await client.set(`user:${id}`, newUser);
      return newUser as any;
    },
    async getUser(id) {
      const user = await client.get<AppUser>(`user:${id}`);
      if (!user) return null;
      return { ...user, emailVerified: null };
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
      if (!user) return null;
      return { ...user, emailVerified: null };
    },
    async getUserByAccount({ providerAccountId, provider }) {
       const account = await client.get<any>(`account:${provider}:${providerAccountId}`);
       if (!account) return null;
       const user = await client.get<AppUser>(`user:${account.userId}`);
       if (!user) return null;
       return { ...user, emailVerified: null };
    },
    async updateUser(user) {
      const key = `user:${user.id}`;
      const existingUser = await client.get<AppUser>(key);
      if (!existingUser) throw new Error("User not found to update.");
      const updatedUser = { ...existingUser, ...user };
      await client.set(key, updatedUser);
      return { ...updatedUser, emailVerified: null } as any;
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
          pxat: expires.getTime()
      });
      return { sessionToken, userId, expires };
    },
    async getSessionAndUser(sessionToken) {
      if (!sessionToken) return null;
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

        await client.set(key, updatedSession, { pxat: updatedSession.expires.getTime() });
        return updatedSession;
    },
    async deleteSession(sessionToken) {
        await client.del(`session:${sessionToken}`);
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
          console.error("[NextAuth][Authorize] Error: UID ou email ausente no objeto de credenciais.", { credentials });
          return null; // Retorna nulo, o que aciona um erro de 'CredentialsSignin'
        }

        try {
          // A autenticação da senha já foi feita no cliente com o Firebase.
          // Aqui, apenas garantimos que o usuário existe no nosso banco de dados KV.
          const appUser = await getUserByEmailFromDb(credentials.email);
          
          if (appUser) {
            // Sucesso, usuário encontrado no nosso DB.
            return appUser;
          }
          
          // Se o usuário autenticou no Firebase mas não está no nosso DB, algo está muito errado.
          // Isso não deve acontecer com o fluxo de registro correto.
          console.error(`[NextAuth][Authorize] Error: Usuário autenticado pelo Firebase (${credentials.email}) não foi encontrado no banco de dados do Vercel KV.`);
          return null;
          
        } catch (error) {
          console.error("[NextAuth][Authorize] Critical Error: Exceção durante a busca do usuário no Vercel KV.", error);
          // Qualquer erro de leitura no banco de dados deve impedir o login.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
        if (session.user) {
            const appUser = user as AppUser;
            session.user.id = appUser.id;
            session.user.accessLevel = appUser.accessLevel;
            session.user.role = appUser.role;
            session.user.subRole = appUser.subRole;
            session.user.name = appUser.name;
            session.user.email = appUser.email;
            session.user.image = appUser.image;
            session.user.birthdate = appUser.birthdate;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para o login em caso de qualquer erro de auth.
  },
};
