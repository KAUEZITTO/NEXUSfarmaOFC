
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser, verifyUserPassword } from '@/lib/actions';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth][Authorize] Email ou senha não fornecidos.");
          return null;
        }

        // Etapa 1: Verificar a senha com segurança no backend.
        const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);

        if (!isPasswordValid) {
            console.warn(`[NextAuth][Authorize] Falha na autenticação para o email: ${credentials.email}`);
            return null;
        }

        // Etapa 2: Se a senha for válida, buscar os dados do usuário no KV.
        const user = await validateAndGetUser(credentials.email);
        
        if (!user) {
            console.error(`[NextAuth][Authorize] Usuário autenticado com sucesso, mas não encontrado no banco de dados: ${credentials.email}`);
            return null;
        }
        
        // Etapa 3: Retornar o objeto de usuário para o NextAuth criar a sessão.
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (trigger === "signIn" && user) {
        token.id = user.id;
        token.name = user.name;
        token.location = user.location;
        token.locationId = user.locationId;
        token.accessLevel = user.accessLevel;
        token.role = user.role;
        token.subRole = user.subRole;
        token.birthdate = user.birthdate;
        token.avatarColor = user.avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.location = token.location;
            session.user.locationId = token.locationId;
            session.user.accessLevel = token.accessLevel;
            session.user.role = token.role;
            session.user.subRole = token.subRole;
            session.user.birthdate = token.birthdate;
            session.user.avatarColor = token.avatarColor;
            
            // Atualiza o 'lastSeen' de forma assíncrona
            await updateUserLastSeen(token.id as string);
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
};
    