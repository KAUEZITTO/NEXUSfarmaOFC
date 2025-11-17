
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

// Esta função é chamada pela Server Action no fluxo de login do cliente.
export async function validateAndGetUser(email: string): Promise<AppUser | null> {
    if (!email) return null;
    try {
        const users = await readData<AppUser>('users');
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return null;

        // Regra de negócio especial para o superusuário
        if (user.email === 'kauemoreiraofc2@gmail.com') {
            user.accessLevel = 'Admin';
            user.subRole = 'Coordenador';
        }
        
        // Garante que o usuário do hospital tenha um locationId
        if (user.location === 'Hospital' && !user.locationId) {
            const units = await getUnits();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if (hospitalUnit) {
                user.locationId = hospitalUnit.id;
            }
        }

        const { password, ...userForSession } = user;
        return userForSession;

    } catch (error) {
        console.error("CRITICAL: Failed to read user data from Vercel KV in validateAndGetUser.", error);
        return null;
    }
}


export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  adapter: KVAdapter(kv),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Os dados do usuário agora são passados como uma string JSON.
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Error: User data not provided.");
          return null;
        }

        try {
            // A única responsabilidade desta função agora é parsear os dados do usuário
            // que já foram validados e buscados no cliente.
            // Isso evita qualquer chamada de banco de dados ou lógica assíncrona aqui.
            const user = JSON.parse(credentials.user);
            return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Error parsing user JSON.", error);
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
