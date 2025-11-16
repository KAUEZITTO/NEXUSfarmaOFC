
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

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
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Error: Email not provided.");
          return null;
        }

        try {
          // The password has already been verified by Firebase on the client-side.
          // This function's only job is to fetch the user from our database.
          const userFromDb = await getUserByEmailFromDb(credentials.email);
          
          if (!userFromDb) {
            console.error(`[NextAuth][Authorize] Error: User with email ${credentials.email} not found in KV database.`);
            return null;
          }

          // **THE CRITICAL FIX**: Never return the password hash.
          // Create a new object for the session without the password.
          const { password, ...userForSession } = userFromDb;
            
          // Lógica de superusuário
          if (userForSession.email === 'kauemoreiraofc2@gmail.com') {
            userForSession.accessLevel = 'Admin';
            userForSession.subRole = 'Coordenador';
          }
          
          // Garante que usuários do hospital tenham seu locationId definido.
          if (userForSession.location === 'Hospital' && !userForSession.locationId) {
              const units = await getUnits();
              const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
              if (hospitalUnit) {
                  userForSession.locationId = hospitalUnit.id;
              }
          }

          return userForSession;

        } catch (error: any) {
            console.error("[NextAuth][Authorize] Unexpected error during authorization:", error);
            return null;
        }
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
