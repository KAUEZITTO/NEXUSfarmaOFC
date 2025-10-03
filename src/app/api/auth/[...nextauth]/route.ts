
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import bcrypt from 'bcrypt';
import { readData } from '@/lib/data';
import { User } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  // Configura a estratégia de sessão para usar JSON Web Tokens (JWT).
  // Isso é essencial para que o middleware funcione corretamente no App Router.
  session: {
    strategy: 'jwt',
  },
  // Define os provedores de autenticação que serão usados.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // O nome que será exibido no formulário de login (se não for um formulário customizado).
      name: 'Credentials',
      // As credenciais que esperamos receber do formulário de login.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Password", type: "password" }
      },
      // A lógica para autorizar o usuário.
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Credenciais ausentes');
          return null;
        }

        // Lógica para encontrar o usuário no "banco de dados" (Vercel KV).
        const users = await readData<User>('users');
        const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());

        if (!user) {
          console.log('Usuário não encontrado:', credentials.email);
          return null; // Usuário não encontrado.
        }

        // Compara a senha enviada com o hash salvo no banco.
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          console.log('Senha incorreta para o usuário:', credentials.email);
          return null; // Senha incorreta.
        }

        console.log('Usuário autenticado com sucesso:', user.email);
        // Se tudo estiver correto, retorna o objeto do usuário (sem a senha).
        // Este objeto será usado para criar o JWT.
        return {
          id: user.id,
          email: user.email,
          name: user.role, // Podemos usar o 'role' como nome para exibição
          role: user.role,
          accessLevel: user.accessLevel,
        };
      }
    })
  ],
  // Callbacks são funções assíncronas que permitem controlar o que acontece
  // durante as ações do NextAuth.js.
  callbacks: {
    // O callback `jwt` é chamado sempre que um JWT é criado ou atualizado.
    // O token retornado aqui é o que será criptografado no cookie.
    async jwt({ token, user }) {
      // Se `user` existe, significa que é o momento do login.
      // Adicionamos as propriedades do usuário (role, accessLevel) ao token.
      if (user) {
        token.role = user.role;
        token.accessLevel = user.accessLevel;
      }
      return token;
    },
    // O callback `session` é chamado sempre que uma sessão é acessada.
    // Ele recebe o token do callback `jwt` e permite que você personalize
    // o objeto de sessão que é retornado ao cliente.
    async session({ session, token }) {
      // Adicionamos as propriedades do token (que buscamos no callback `jwt`)
      // ao objeto `session.user` para que fiquem acessíveis no lado do cliente.
      if (token && session.user) {
        session.user.role = token.role;
        session.user.accessLevel = token.accessLevel;
      }
      return session;
    },
  },
  // Define a página de login customizada.
  pages: {
    signIn: '/login',
  },
};

// Exporta os handlers GET e POST para o Next.js, que são criados pela função NextAuth.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
