
import { type Adapter } from "next-auth/adapters";
import { type KV } from "@vercel/kv";

export function KVAdapter(kv: KV): Adapter {
  return {
    async createUser(user) {
      const id = user.id || `user_${Date.now()}`;
      const newUser = { ...user, id };
      // Create mappings for finding user by email and by id
      await kv.hset(`user:${user.email}`, newUser);
      await kv.hset(`user:id:${id}`, newUser);
      return { ...newUser, emailVerified: null };
    },
    async getUser(id) {
      const user = await kv.hgetall(`user:id:${id}`);
      if (!user) return null;
      return { ...(user as any), emailVerified: null };
    },
    async getUserByEmail(email) {
      const user = await kv.hgetall(`user:${email}`);
      if (!user) return null;
      return { ...(user as any), emailVerified: null };
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const accountKey = `account:${provider}:${providerAccountId}`;
      const userId = await kv.get<string>(accountKey);
      if (!userId) return null;
      const user = await kv.hgetall(`user:id:${userId}`);
      if (!user) return null;
      return { ...(user as any), emailVerified: null };
    },
    async updateUser(user) {
      const userKeyById = `user:id:${user.id}`;
      const existingUser = await kv.hgetall<any>(userKeyById);
      if (!existingUser) throw new Error("User not found for update.");

      const updatedUser = { ...existingUser, ...user };
      await kv.hset(userKeyById, updatedUser);

      // Handle email change: delete old key and create new one
      if (existingUser.email !== user.email) {
          await kv.del(`user:${existingUser.email}`);
      }
      await kv.hset(`user:${user.email}`, updatedUser);

      return { ...(updatedUser as any), emailVerified: null };
    },
    async deleteUser(userId) {
       const userEmail = await kv.hget(`user:id:${userId}`, 'email') as string | null;
       if(userEmail) {
           await kv.del(`user:${userEmail}`);
       }
       await kv.del(`user:id:${userId}`);
    },
    async linkAccount(account) {
      const key = `account:${account.provider}:${account.providerAccountId}`;
      // Store only the userId to link the account, not the full account object
      await kv.set(key, account.userId);
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await kv.del(`account:${provider}:${providerAccountId}`);
    },
    async createSession(session) {
      const key = `session:${session.sessionToken}`;
      await kv.set(key, session, { ex: Math.round((new Date(session.expires).getTime() - Date.now()) / 1000) });
      return session;
    },
    async getSessionAndUser(sessionToken) {
      if (!sessionToken) return null;
      const session = await kv.get<any>(`session:${sessionToken}`);
      if (!session) return null;

      const user = await kv.hgetall<any>(`user:id:${session.userId}`);
      if (!user) return null;

      return { session, user: { ...user, emailVerified: null } };
    },
    async updateSession(session) {
      const key = `session:${session.sessionToken}`;
      await kv.set(key, session, { ex: Math.round((new Date(session.expires).getTime() - Date.now()) / 1000) });
      return session;
    },
    async deleteSession(sessionToken) {
      await kv.del(`session:${sessionToken}`);
    },
    async createVerificationToken(token) {
      const key = `verification:${token.identifier}:${token.token}`;
      await kv.set(key, token, { ex: Math.round((new Date(token.expires).getTime() - Date.now()) / 1000) });
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      const key = `verification:${identifier}:${token}`;
      const verificationToken = await kv.get<any>(key);
      if (!verificationToken) return null;
      
      await kv.del(key);
      return { ...verificationToken, id: key };
    },
  };
}
