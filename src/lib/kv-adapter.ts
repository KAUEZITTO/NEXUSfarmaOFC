
import { type Adapter } from "next-auth/adapters";
import { type KV } from "@vercel/kv";

export function KVAdapter(kv: KV): Adapter {
  return {
    async createUser(user) {
      const newUser = { ...user, id: `user_${user.email}` };
      await kv.hset(`user:${user.email}`, newUser);
      return newUser;
    },
    async getUser(id) {
      const user = await kv.hgetall(`user:id:${id}`);
      if (!user) return null;
      return user as any;
    },
    async getUserByEmail(email) {
      const user = await kv.hgetall(`user:${email}`);
      if (!user) return null;
      return user as any;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await kv.get(`account:${provider}:${providerAccountId}`);
      if (!account) return null;
      const user = await kv.hgetall(`user:id:${(account as any).userId}`);
      if (!user) return null;
      return user as any;
    },
    async updateUser(user) {
      const userEmail = await kv.hget(`user:id:${user.id}`, 'email');
      if (!userEmail) throw new Error("User not found to update");
      const updatedUser = { ...user, email: userEmail };
      await kv.hset(`user:${userEmail}`, updatedUser);
      return updatedUser as any;
    },
    async deleteUser(userId) {
       const userEmail = await kv.hget(`user:id:${userId}`, 'email');
       if(userEmail) {
           await kv.del(`user:${userEmail}`);
           await kv.del(`user:id:${userId}`);
       }
    },
    async linkAccount(account) {
      await kv.set(`account:${account.provider}:${account.providerAccountId}`, account);
      await kv.set(`user:id:${account.userId}`, { id: account.userId });
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await kv.del(`account:${provider}:${providerAccountId}`);
    },
    async createSession(session) {
      await kv.set(`session:${session.sessionToken}`, session, { ex: session.expires.getTime() / 1000 });
      return session;
    },
    async getSessionAndUser(sessionToken) {
      const session = await kv.get(`session:${sessionToken}`);
      if (!session) return null;
      const user = await kv.hgetall(`user:id:${(session as any).userId}`);
      if (!user) return null;
      return { session, user } as any;
    },
    async updateSession(session) {
      await kv.set(`session:${session.sessionToken}`, session, { ex: session.expires.getTime() / 1000 });
      return session;
    },
    async deleteSession(sessionToken) {
      await kv.del(`session:${sessionToken}`);
    },
    async createVerificationToken(verificationToken) {
       await kv.set(`verificationToken:${verificationToken.identifier}:${verificationToken.token}`, verificationToken, { ex: verificationToken.expires.getTime() / 1000 });
       return verificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const verificationToken = await kv.get(`verificationToken:${identifier}:${token}`);
      if (!verificationToken) return null;
      await kv.del(`verificationToken:${identifier}:${token}`);
      return verificationToken as any;
    },
  };
}
