

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser, UserLocation } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 */
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    return null;
  }
}

/**
 * Options for NextAuth.js configuration.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("[NextAuth][Authorize] Error: UID ou email ausente nas credenciais.");
          return null;
        }
        
        const userFromDb = await getUserByEmailFromDb(credentials.email);

        if (!userFromDb) {
            console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} não encontrado no banco de dados.`);
            return null; 
        }

        // Hardcoded admin override
        if (userFromDb.email === 'kauemoreiraofc2@gmail.com') {
          userFromDb.accessLevel = 'Admin';
          userFromDb.subRole = 'Coordenador';
        }
        
        // Find hospital unit ID if user is from hospital
        if (userFromDb.location === 'Hospital' && !userFromDb.locationId) {
            const units = await getUnits();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if (hospitalUnit) {
                userFromDb.locationId = hospitalUnit.id;
            }
        }

        return {
          id: credentials.uid,
          email: userFromDb.email,
          ...userFromDb // Pass the whole user object to the jwt callback
        } as AppUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // This callback is only triggered on sign-in, not on every request
        // We populate the token with the user data from authorize once.
        if (user) {
            // Hardcoded admin override on session creation
            if (user.email === 'kauemoreiraofc2@gmail.com') {
                token.accessLevel = 'Admin';
                token.subRole = 'Coordenador';
            } else {
                token.accessLevel = user.accessLevel;
                token.subRole = user.subRole;
            }

            token.id = user.id;
            token.location = user.location;
            token.locationId = user.locationId;
            token.role = user.role;
            token.name = user.name;
            token.birthdate = user.birthdate;
            token.avatarColor = user.avatarColor;
        }
        
        return token;
    },
    async session({ session, token }) {
        if (session.user) {
            session.user.id = token.id as string;
            session.user.location = token.location as UserLocation;
            session.user.locationId = token.locationId as string;
            session.user.accessLevel = token.accessLevel as AppUser['accessLevel'];
            session.user.role = token.role as AppUser['role'];
            session.user.subRole = token.subRole as AppUser['subRole'];
            session.user.name = token.name;
            session.user.birthdate = token.birthdate;
            session.user.avatarColor = token.avatarColor as string;
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
