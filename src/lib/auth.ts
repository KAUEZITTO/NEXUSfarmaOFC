
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

// Função para buscar o usuário no banco de dados.
// É importante que esta função seja robusta e trate erros de forma adequada.
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Failed to read user data from Vercel KV.", error);
    // Em caso de falha na leitura do banco de dados, retornamos null para evitar que o login prossiga com dados incompletos.
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  // Estratégia de sessão no banco de dados para evitar cookies grandes
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
        email: { label: "Email", type: "email" },
        // A senha não é usada aqui, mas a definição corresponde ao que o cliente envia.
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Error: Email not provided.");
          return null;
        }

        // A única responsabilidade desta função é buscar o usuário no banco de dados.
        // A validação da senha já foi feita no cliente usando o SDK do Firebase.
        const userFromDb = await getUserByEmailFromDb(credentials.email);
        
        if (!userFromDb) {
          console.error(`[NextAuth][Authorize] Error: User ${credentials.email} not found in KV database.`);
          return null;
        }
        
        // Remove a senha antes de retornar o objeto do usuário para a sessão.
        // Isso é crucial para evitar erros de serialização e por segurança.
        const { password, ...userForSession } = userFromDb;
        
        // Regra de negócio especial para o superusuário
        if (userForSession.email === 'kauemoreiraofc2@gmail.com') {
          userForSession.accessLevel = 'Admin';
          userForSession.subRole = 'Coordenador';
        }
        
        // Garante que o usuário do hospital tenha um locationId
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
    // O callback `jwt` não é usado com a estratégia 'database', mas o `session` é essencial.
    async session({ session, user }) {
        // 'user' aqui vem do adapter (do banco de dados)
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
            
            // Atualiza o "visto por último" do usuário
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
