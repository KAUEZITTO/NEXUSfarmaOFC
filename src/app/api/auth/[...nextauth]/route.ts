
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
// Importa a instância do Firebase específica para o servidor
import { firebaseServerApp } from '@/lib/firebase/server';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

// Função dedicada e robusta para buscar o usuário no banco de dados (Vercel KV).
async function getUserFromDb(email: string): Promise<User | null> {
  try {
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    // Adiciona log de erro detalhado caso a leitura do KV falhe.
    console.error("CRITICAL: Failed to read user data from Vercel KV.", error);
    // Retorna null para interromper a autenticação se o banco de dados estiver inacessível.
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  // O adaptador é crucial para a estratégia 'database'. Ele armazena a sessão no Vercel KV.
  adapter: UpstashRedisAdapter(kv),
  
  // A estratégia 'database' mantém o cookie de sessão pequeno, evitando erros de cabeçalho.
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },

  // Configuração segura de cookies para produção.
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Authorize Error: Missing credentials.");
          return null;
        }

        try {
          // Etapa 1: Autenticar credenciais com o Firebase usando a configuração do servidor.
          const auth = getAuth(firebaseServerApp);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          if (!firebaseUser?.email) {
             console.error("Authorize Error: Firebase user not found after successful sign-in.");
             return null;
          }

          // Etapa 2: Buscar o perfil completo do usuário no nosso banco de dados (Vercel KV).
          // Este passo é OBRIGATÓRIO. O objeto retornado aqui é o que será salvo na sessão.
          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`Authorize Error: User ${firebaseUser.email} authenticated with Firebase but not found in the application database (Vercel KV).`);
            return null;
          }
          
          // Etapa 3: Retornar o objeto de usuário completo. O NextAuth cuidará de criar a sessão.
          return appUser;

        } catch (error: any) {
          // Log detalhado do erro do Firebase no servidor.
          console.error("Authorize Error: Firebase authentication failed.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          // Retorna null em caso de falha de autenticação (ex: senha errada, API key inválida).
          // Isso resultará no erro OAuthSignin na tela de login.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // O callback `session` é chamado para construir o objeto de sessão do lado do cliente.
    // O parâmetro `user` aqui vem diretamente do banco de dados da sessão (Vercel KV), graças ao adaptador.
    async session({ session, user }) {
      if (session.user) {
        // Enriquece o objeto de sessão padrão com os campos personalizados do nosso banco.
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.name = user.name;
        session.user.email = user.email;
        // Adicione outros campos que você precisar no frontend aqui
        // Ex: session.user.accessLevel = user.accessLevel;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, com `?error=...` na URL.
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
