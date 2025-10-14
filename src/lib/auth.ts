
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData } from './data';

/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 * Esta função foi movida para dentro do auth.ts para evitar problemas de build.
 */
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    // Em caso de falha de leitura do banco, o login deve ser impedido.
    return null;
  }
}

/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' é mais simples e, ao minimizar o conteúdo do token,
  // evitamos o erro 'REQUEST_HEADER_TOO_LARGE'.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("[NextAuth][Authorize] Error: UID ou email ausente nas credenciais.");
          return null;
        }

        try {
          // A autenticação da senha já foi feita no cliente com o Firebase.
          // Aqui, apenas garantimos que o usuário existe no nosso banco de dados KV.
          const appUser = await getUserByEmailFromDb(credentials.email);
          
          if (appUser) {
            // Sucesso! Retornamos os dados essenciais para o token.
            return appUser;
          }
          
          console.error(`[NextAuth][Authorize] Error: Usuário autenticado pelo Firebase (${credentials.email}) não foi encontrado no banco de dados.`);
          return null;
          
        } catch (error) {
          console.error("[NextAuth][Authorize] Critical Error: Exceção durante a busca do usuário no KV.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // A callback 'jwt' é chamada sempre que um token é criado ou atualizado.
    // **A SOLUÇÃO CRÍTICA ESTÁ AQUI**: Armazenamos o mínimo de dados possível.
    async jwt({ token, user }) {
        if (user) {
            // 'user' é o objeto retornado pela função 'authorize'.
            const appUser = user as AppUser;
            token.id = appUser.id;
            token.accessLevel = appUser.accessLevel;
            token.role = appUser.role;
            token.subRole = appUser.subRole;
        }
        return token;
    },
    // A callback 'session' é chamada para criar o objeto de sessão do cliente.
    // Ela recebe o token JWT e o transforma no objeto 'session.user'.
    async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            session.user.accessLevel = token.accessLevel as AppUser['accessLevel'];
            session.user.role = token.role as AppUser['role'];
            session.user.subRole = token.subRole as AppUser['subRole'];
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para o login em caso de qualquer erro de auth.
  },
};
