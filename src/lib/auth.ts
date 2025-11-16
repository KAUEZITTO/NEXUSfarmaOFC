

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser, UserLocation } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';

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
  // A estratégia 'database' armazena a sessão no banco de dados (Vercel KV),
  // enviando apenas um ID de sessão para o cliente, o que resolve o erro
  // "REQUEST_HEADER_TOO_LARGE" ao evitar cookies grandes.
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
          id: userFromDb.id,
          email: userFromDb.email,
          name: userFromDb.name,
          image: userFromDb.image,
          birthdate: userFromDb.birthdate,
          location: userFromDb.location,
          locationId: userFromDb.locationId,
          role: userFromDb.role,
          subRole: userFromDb.subRole,
          accessLevel: userFromDb.accessLevel,
          avatarColor: userFromDb.avatarColor,
        } as AppUser;
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
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
