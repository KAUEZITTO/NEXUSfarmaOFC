
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen } from '@/lib/actions';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database', // Usar 'database' para sessões gerenciadas pelo adapter
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  adapter: KVAdapter(kv), // Usa o Vercel KV para persistir sessões e usuários
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Os dados do usuário agora são passados como uma string JSON, pré-validados no cliente.
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        // A função authorize agora é extremamente simples e não faz chamadas de DB ou validação.
        // Ela apenas recebe o objeto de usuário que já foi validado e buscado no cliente.
        // Isso evita o erro de configuração no ambiente serverless.
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Error: User data not provided in credentials.");
          return null;
        }

        try {
            const user = JSON.parse(credentials.user);
            // O objeto 'user' já vem limpo, sem a senha.
            return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Error parsing user JSON.", error);
            return null;
        }
      },
    }),
  ],
  callbacks: {
    // O callback 'jwt' não é necessário com a estratégia 'database'
    async session({ session, user }) {
        // A sessão é enriquecida com os dados do usuário vindos do banco de dados (via adapter)
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
            
            // Atualiza o 'lastSeen' do usuário no banco de dados a cada sessão
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

    