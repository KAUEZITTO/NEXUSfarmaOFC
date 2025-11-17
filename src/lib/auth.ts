
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen, validateAndGetUser } from '@/lib/actions';
import type { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  // A estratégia de sessão DEVE ser 'jwt' para o CredentialsProvider funcionar.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  // O Adapter é REMOVIDO pois é incompatível com a estratégia 'jwt'.
  // O token JWT será a única fonte de verdade para a sessão.
  
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Os dados do usuário agora são passados como uma string JSON, pré-validados no cliente.
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        // A função authorize agora é extremamente simples e não faz chamadas de DB.
        // Ela apenas recebe o objeto de usuário que já foi validado no cliente.
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
    // O callback 'jwt' é o coração da sessão com a estratégia JWT.
    async jwt({ token, user }) {
      // No login inicial (o objeto 'user' existe), populamos o token.
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
        // Preenche o objeto 'session.user' com os dados do token JWT a cada requisição.
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

            // Atualiza o 'lastSeen' do usuário no banco de dados.
            // Esta chamada é "fire-and-forget" para não bloquear a resposta da sessão.
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
