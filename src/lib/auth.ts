
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen } from '@/lib/actions';
import type { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' é OBRIGATÓRIA para o CredentialsProvider.
  // A remoção do adapter e o uso explícito de JWT resolve o erro.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        // Os dados do usuário agora são passados como uma string JSON,
        // pré-validados e buscados no cliente antes de chamar o signIn.
        user: { label: "User JSON", type: "text" },
      },
      async authorize(credentials) {
        // A função authorize agora é síncrona e passiva.
        // Ela não faz chamadas de rede ou validações complexas.
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Erro: Dados do usuário não foram fornecidos.");
          return null;
        }

        try {
            const user = JSON.parse(credentials.user);
            // O objeto 'user' já vem limpo (sem senha) e validado do cliente.
            // Retornar o objeto de usuário aqui inicia a criação do token JWT.
            return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Erro ao parsear o JSON do usuário.", error);
            return null;
        }
      },
    }),
  ],
  callbacks: {
    // O callback 'jwt' é chamado no login e popula o token com os dados do usuário.
    async jwt({ token, user }) {
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
    // O callback 'session' usa os dados do token JWT para preencher o objeto session.user
    // que fica disponível no cliente a cada requisição.
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

            // Atualiza o 'lastSeen' do usuário no banco de dados.
            // A chamada é "fire-and-forget" para não bloquear a resposta da sessão.
            updateUserLastSeen(token.id as string).catch(console.error);
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona todos os erros de auth para a página de login
  },
};
