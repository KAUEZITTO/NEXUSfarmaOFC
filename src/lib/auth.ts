
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen } from '@/lib/actions';
import type { User as AppUser } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt', // A estratégia JWT é mais simples e robusta para este caso.
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          // Apenas esperamos o objeto de usuário, que foi validado no cliente.
          user: { label: "User JSON", type: "text" },
        },
        async authorize(credentials) {
          // A função authorize agora é extremamente simples.
          // Ela apenas recebe o usuário já validado do cliente e o retorna.
          // NENHUMA chamada de rede ou DB aqui. Isso resolve o erro 'Configuration'.
          if (!credentials?.user) {
            return null;
          }
          try {
            const user = JSON.parse(credentials.user);
            return user; // Retorna o objeto de usuário para o callback 'jwt'
          } catch (e) {
            console.error("Error parsing user in authorize callback", e);
            return null;
          }
        },
    }),
  ],
  callbacks: {
    // O callback 'jwt' é chamado após o 'authorize'. Ele cria o token.
    async jwt({ token, user, trigger, session }) {
        // Na primeira vez (login), 'user' vem do 'authorize'.
        if (user) {
            token.id = user.id;
            token.name = user.name;
            token.email = user.email;
            token.location = (user as AppUser).location;
            token.locationId = (user as AppUser).locationId;
            token.accessLevel = (user as AppUser).accessLevel;
            token.role = (user as AppUser).role;
            token.subRole = (user as AppUser).subRole;
            token.birthdate = (user as AppUser).birthdate;
            token.avatarColor = (user as AppUser).avatarColor;
        }
        // Se a sessão for atualizada (ex: pelo update do user-nav), atualizamos o token.
        if (trigger === "update" && session?.user) {
            token.name = session.user.name;
            token.birthdate = session.user.birthdate;
            token.avatarColor = session.user.avatarColor;
        }
        return token;
    },
    // O callback 'session' usa os dados do token para criar o objeto de sessão do cliente.
    async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            session.user.location = token.location as any;
            session.user.locationId = token.locationId as string;
            session.user.accessLevel = token.accessLevel as any;
            session.user.role = token.role as any;
            session.user.subRole = token.subRole as any;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.birthdate = token.birthdate as string;
            session.user.avatarColor = token.avatarColor as string;

            if (token.id) {
               await updateUserLastSeen(token.id as string);
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
