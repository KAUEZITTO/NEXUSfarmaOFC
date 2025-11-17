
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen, validateAndGetUser, verifyUserPassword } from '@/lib/actions';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';

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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error("[NextAuth][Authorize] Email ou senha não fornecidos.");
          return null;
        }

        // 1. Verificar se a senha é válida usando o Firebase Admin SDK (via nossa Server Action).
        const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
        if (!isPasswordValid) {
          console.warn(`[NextAuth][Authorize] Falha na autenticação para o email: ${credentials.email}`);
          return null; // Senha incorreta ou usuário não existe no Firebase Auth.
        }
        
        // 2. Se a senha for válida, buscar os dados do usuário no nosso banco de dados (Vercel KV).
        const user = await validateAndGetUser(credentials.email);
        if (!user) {
          console.error(`[NextAuth][Authorize] Usuário autenticado com sucesso no Firebase, mas não encontrado no banco de dados do NexusFarma: ${credentials.email}`);
          // Lançar um erro aqui informa ao NextAuth que o login falhou de forma controlada.
          throw new Error("User not found in application database.");
        }

        // 3. Retornar o objeto de usuário completo para o NextAuth.
        return user;
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

    