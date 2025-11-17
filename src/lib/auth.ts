
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser } from '@/lib/actions';
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
        // A senha não é mais usada aqui, mas a estrutura é mantida.
        // O `user` JSON será passado pelo cliente.
        user: { label: "User JSON", type: "text" },
      },
      // A função authorize é removida para evitar o erro `Configuration`.
      // A validação agora acontece no cliente e a criação do token no callback `jwt`.
      async authorize(credentials) {
        if (!credentials?.email) {
          console.error("[NextAuth][Authorize] Email não foi fornecido nas credenciais.");
          return null;
        }
        // A lógica foi movida para o callback `jwt`.
        // Apenas retornamos um objeto mínimo para o `jwt` callback ser acionado.
        return { id: '', email: credentials.email };
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, account }) {
      // Na primeira vez que o token é criado (após o login)
      if (trigger === "signIn" && account?.provider === 'credentials' && token.email) {
        const appUser = await validateAndGetUser(token.email);
        if (appUser) {
          token.id = appUser.id;
          token.name = appUser.name;
          token.location = appUser.location;
          token.locationId = appUser.locationId;
          token.accessLevel = appUser.accessLevel;
          token.role = appUser.role;
          token.subRole = appUser.subRole;
          token.birthdate = appUser.birthdate;
          token.avatarColor = appUser.avatarColor;
        }
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

    