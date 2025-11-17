
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser, updateUserLastSeen } from '@/lib/actions';
import type { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // O objeto de usuário, já validado no cliente, será passado como uma string JSON.
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        // Esta função agora é extremamente simples e não faz chamadas de rede.
        // Ela apenas confia nos dados já validados que o cliente enviou.
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Dados do usuário não fornecidos.");
          return null;
        }

        try {
            const user = JSON.parse(credentials.user);
            // Retorna o objeto do usuário para ser usado no callback jwt.
            return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Erro ao parsear o JSON do usuário.", error);
            return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Este callback é acionado após o 'authorize'.
      // Se o objeto 'user' (vindo do authorize) existir, é o login inicial.
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
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
        // Preenche o objeto 'session.user' com os dados do token JWT.
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

            // Atualiza o lastSeen sem bloquear a resposta.
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
