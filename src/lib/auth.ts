
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen } from '@/lib/actions';
import type { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' é obrigatória para o CredentialsProvider.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  // O Adapter é REMOVIDO pois é incompatível com a estratégia 'jwt'.
  
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
        // Ela não faz chamadas de rede, o que elimina o erro 'Configuration'.
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Erro: Dados do usuário não foram fornecidos.");
          return null;
        }

        try {
            const user = JSON.parse(credentials.user);
            // O objeto 'user' já vem limpo, sem a senha.
            // Retornar o objeto de usuário inicia a criação do token JWT.
            return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Erro ao parsear o JSON do usuário.", error);
            return null;
        }
      },
    }),
  ],
  callbacks: {
    // O callback 'jwt' popula o token com os dados do usuário no momento do login.
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
    // O callback 'session' usa os dados do token para preencher o objeto session.user a cada requisição.
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
            // Esta chamada é "fire-and-forget" para não bloquear a resposta da sessão.
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
