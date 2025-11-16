
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

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
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Error: Email não foi fornecido para autorização.");
          return null;
        }

        try {
            // A senha JÁ FOI VALIDADA no cliente pelo SDK do Firebase.
            // A tarefa aqui é apenas encontrar o usuário no nosso DB e retorná-lo para criar a sessão.
            const userFromDb = await getUserByEmailFromDb(credentials.email);
            
            if (!userFromDb) {
                console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} não encontrado no banco de dados KV.`);
                return null;
            }
            
            // Lógica de superusuário
            if (userFromDb.email === 'kauemoreiraofc2@gmail.com') {
              userFromDb.accessLevel = 'Admin';
              userFromDb.subRole = 'Coordenador';
            }
            
            // Garante que usuários do hospital tenham seu locationId definido.
            if (userFromDb.location === 'Hospital' && !userFromDb.locationId) {
                const units = await getUnits();
                const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
                if (hospitalUnit) {
                    userFromDb.locationId = hospitalUnit.id;
                }
            }

            // Retorna o objeto do usuário para o NextAuth criar a sessão.
            // IMPORTANTE: Apenas retornamos os dados. Nenhuma outra operação assíncrona deve ocorrer aqui.
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
            };

        } catch (error: any) {
            console.error("[NextAuth][Authorize] Erro inesperado durante a autorização:", error);
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
            
            // A atualização do "lastSeen" agora é feita aqui, de forma segura.
            if (user.id) {
               await updateUserLastSeen(user.id);
            }
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para a página de login em caso de erro.
  },
};
