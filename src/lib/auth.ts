
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';
import { getAdminApp } from '@/lib/firebase/admin';

async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Failed to read user data from Vercel KV.", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: KVAdapter(kv),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        // This function is now ONLY called after client-side Firebase validation.
        // It receives the email and its job is to find the user in the database.
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Error: Email not provided after client validation.");
          return null;
        }

        const userFromDb = await getUserByEmailFromDb(credentials.email);
        
        if (!userFromDb) {
          console.error(`[NextAuth][Authorize] Error: User ${credentials.email} authenticated but not found in KV database.`);
          return null;
        }
        
        // Return a clean user object for the session, WITHOUT the password.
        const { password, ...userForSession } = userFromDb;

        // Superuser logic
        if (userForSession.email === 'kauemoreiraofc2@gmail.com') {
          userForSession.accessLevel = 'Admin';
          userForSession.subRole = 'Coordenador';
        }
        
        // Ensure hospital user has locationId
        if (userForSession.location === 'Hospital' && !userForSession.locationId) {
            const units = await getUnits();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if (hospitalUnit) {
                userForSession.locationId = hospitalUnit.id;
            }
        }
        return userForSession;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
        if (session.user) {
            session.user.id = user.id;
            session.user.location = user.location;
            session.user.locationId = user.locationId;
            session.user.accessLevel = user.accessLevel;
            session.user.role = user.role;
            session.user.subRole = user.subRole;
            session.user.name = user.name;
            session.user.birthdate = user.birthdate;
            session.user.avatarColor = user.avatarColor;
            
            if (user.id) {
               await updateUserLastSeen(user.id);
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
