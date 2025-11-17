
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser, verifyUserPassword, updateUserLastSeen } from '@/lib/actions';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt', // CORREÇÃO FINAL: JWT é a única estratégia compatível com CredentialsProvider.
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
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

        const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
        
        if (!isPasswordValid) {
          console.warn(`[NextAuth][Authorize] Falha na autenticação para o email: ${credentials.email}`);
          return null;
        }

        const user = await validateAndGetUser(credentials.email);

        if (!user) {
          console.error(`[NextAuth][Authorize] Usuário autenticado com sucesso, mas não encontrado no banco de dados: ${credentials.email}`);
          return null;
        }
        
        // Se a autorização for bem-sucedida, o objeto 'user' é passado para o callback 'jwt'.
        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // No login inicial (objeto 'user' está presente)
      if (user) {
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
        // A partir do token JWT, preenchemos o objeto de sessão
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
            
            // Atualiza o lastSeen sem bloquear a resposta da sessão
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
    