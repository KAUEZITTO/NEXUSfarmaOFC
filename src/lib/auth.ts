
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import { updateUserLastSeen, validateAndGetUser } from '@/lib/actions';
import type { User, UserLocation, Role, SubRole, AccessLevel } from '@/lib/types';

// O CredentialsProvider foi removido. A autenticação agora é gerenciada
// por uma Server Action e cookies JWT manuais para máxima estabilidade.
// Este arquivo é mantido para que o [...nextauth]/route.ts não quebre,
// mas o provedor de credenciais não será mais invocado pelo fluxo de login principal.

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    // Provedores futuros (como Google, etc.) podem ser adicionados aqui.
    // O CredentialsProvider foi intencionalmente removido para resolver o erro de configuração.
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.location = (user as User).location;
        token.locationId = (user as User).locationId;
        token.accessLevel = (user as User).accessLevel;
        token.role = (user as User).role;
        token.subRole = (user as User).subRole;
        token.birthdate = (user as User).birthdate;
        token.avatarColor = (user as User).avatarColor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.location = token.location as UserLocation;
        session.user.locationId = token.locationId as string | undefined;
        session.user.accessLevel = token.accessLevel as AccessLevel;
        session.user.role = token.role as Role;
        session.user.subRole = token.subRole as SubRole | undefined;
        session.user.birthdate = token.birthdate as string | null;
        session.user.avatarColor = token.avatarColor as string | undefined;

        updateUserLastSeen(token.id as string).catch(console.error);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', 
  },
};
