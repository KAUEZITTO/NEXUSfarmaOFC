
import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen } from '@/lib/actions';
import type { User, UserLocation, Role, SubRole, AccessLevel } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' é OBRIGATÓRIA para o CredentialsProvider e é a solução para a instabilidade.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  
  // O Adapter é INCOMPATÍVEL com a estratégia 'jwt' e estava causando erros. Ele foi removido.
  // adapter: KVAdapter(kv),
  
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
        // Ela não faz chamadas de rede ou validações complexas. Isso elimina o erro '?error=Configuration'.
        if (!credentials?.user) {
          console.error("[NextAuth][Authorize] Erro: Dados do usuário não foram fornecidos.");
          return null;
        }

        try {
            const user: User = JSON.parse(credentials.user);
            // O objeto 'user' já vem limpo (sem senha) e validado do cliente.
            // Retornar o objeto de usuário aqui inicia a criação do token JWT.
            return user as NextAuthUser;
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
        // Mapeia os dados do usuário para o token JWT na primeira vez que ele é criado.
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
    // O callback 'session' usa os dados do token JWT para preencher o objeto session.user
    // que fica disponível no cliente a cada requisição.
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
