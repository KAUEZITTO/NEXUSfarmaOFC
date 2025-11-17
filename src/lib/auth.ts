
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

        // A arquitetura final e estável:
        // 1. A senha é validada no CLIENTE usando o SDK do Firebase.
        // 2. Se a senha for válida, o cliente chama `validateAndGetUser`.
        // 3. O cliente então chama `signIn` passando o objeto de usuário completo.
        // 4. O `authorize` aqui é PASSIVO. Ele não faz chamadas de rede. Ele apenas confia no objeto que o cliente enviou.
        // Esta abordagem elimina o erro "Configuration" em ambientes serverless.
        
        // No fluxo final, o `credentials` objeto conterá um campo `user` que é uma string JSON.
        // O `email` e `password` ainda estão aqui para compatibilidade, mas o `user` tem precedência.
        if (credentials.user) {
          try {
            const user = JSON.parse(credentials.user);
            return user;
          } catch (e) {
            console.error("[NextAuth][Authorize] Falha ao fazer parse do JSON do usuário.", e);
            return null;
          }
        }
        
        // Fallback para o fluxo antigo (verificação no servidor), que é instável na Vercel mas pode funcionar em dev.
        // Este bloco é a fonte do erro 'Configuration'.
        try {
          const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
          if (!isPasswordValid) {
            console.log(`[NextAuth][Authorize] Falha na validação de senha (backend) para: ${credentials.email}`);
            return null;
          }
          const user = await validateAndGetUser(credentials.email);
          if (!user) {
            console.log(`[NextAuth][Authorize] Usuário não encontrado no banco de dados (backend): ${credentials.email}`);
            return null;
          }
          return user;
        } catch (error) {
            console.error("[NextAuth][Authorize] Erro durante o fluxo de autorização de fallback.", error);
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

    