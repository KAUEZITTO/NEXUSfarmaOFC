
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen, validateAndGetUser, verifyUserPassword } from '@/lib/actions';
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
        email: { label: "Email", type: "text" },
        password: {  label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error("[NextAuth][Authorize] Email ou senha não fornecidos.");
          return null;
        }

        try {
          // Passo 1: Verificar a senha usando uma Server Action segura com o Firebase Admin SDK
          const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
          if (!isPasswordValid) {
            console.log(`[NextAuth][Authorize] Falha na validação de senha para o usuário: ${credentials.email}`);
            return null; // Senha inválida
          }

          // Passo 2: Se a senha for válida, buscar os dados completos do usuário no Vercel KV
          const user = await validateAndGetUser(credentials.email);
          if (!user) {
            console.log(`[NextAuth][Authorize] Usuário validado mas não encontrado no banco de dados: ${credentials.email}`);
            return null; // Usuário não encontrado no KV
          }
          
          // Retorna o objeto do usuário completo para ser usado nos callbacks.
          return user;

        } catch (error) {
            console.error("[NextAuth][Authorize] Erro durante o processo de autorização.", error);
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

    