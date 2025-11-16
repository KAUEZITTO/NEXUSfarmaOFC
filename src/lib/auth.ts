import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';
import { getAdminApp } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 */
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
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
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Error: Email não fornecido.");
          return null;
        }

        try {
            // A função authorize agora confia que o Firebase já validou a senha no cliente.
            // Sua única responsabilidade é buscar o usuário no nosso banco de dados (KV)
            // e construir o objeto de sessão.
            const userFromDb = await getUserByEmailFromDb(credentials.email);
            
            if (!userFromDb) {
                console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} autenticado, mas não encontrado no banco de dados KV.`);
                return null; // Usuário não existe no nosso sistema, nega a sessão.
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
            
            await updateUserLastSeen(userFromDb.id);

            // Retorna o objeto de usuário completo para o NextAuth criar a sessão.
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

        } catch (error: any) {
            console.error("[NextAuth][Authorize] Erro inesperado durante a autorização:", error);
            return null; // Retorna null em caso de qualquer falha.
        }
      },
    }),
  ],
  callbacks: {
    // O callback `jwt` não é mais necessário com a estratégia 'database'
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
