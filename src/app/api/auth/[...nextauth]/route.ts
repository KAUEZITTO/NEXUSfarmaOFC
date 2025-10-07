
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { VercelKVAdapter } from "@auth/vercel-kv-adapter";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

import { kv } from "@/lib/kv";
import { readData, writeData } from '@/lib/data';
import { firebaseServerApp } from '@/lib/firebase/server';
import type { User } from '@/lib/types';


/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 * Centraliza a lógica de leitura e tratamento de erros.
 */
async function getUserFromDb(email: string): Promise<User | null> {
  if (!email) return null;
  try {
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    // Em caso de falha de leitura do banco, o login deve ser impedido.
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: VercelKVAdapter(kv),
  session: {
    // Usar 'database' é crucial para que o cookie seja pequeno e evite o erro 'REQUEST_HEADER_TOO_LARGE'.
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Authorize Error: Credenciais ausentes.");
          return null;
        }

        try {
          const auth = getAuth(firebaseServerApp); // Usa a instância segura do servidor
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          if (!firebaseUser?.email) {
             console.error("Authorize Error: Usuário Firebase não encontrado após login bem-sucedido.");
             return null;
          }

          // Após autenticar com o Firebase, OBRIGATORIAMENTE buscamos o usuário no nosso banco (Vercel KV).
          // Isso garante que temos os dados completos (role, accessLevel, etc.).
          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`Authorize Error: Usuário ${firebaseUser.email} autenticado com Firebase mas não encontrado no banco de dados da aplicação.`);
            return null;
          }
          
          // Retorna o objeto de usuário completo do nosso banco de dados.
          // O NextAuth usará isso para criar a sessão.
          return appUser;

        } catch (error: any) {
          console.error("Authorize Error: Falha na autenticação com Firebase.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          return null; // Retornar null indica falha na autorização.
        }
      },
    }),
  ],
  callbacks: {
    // O callback 'signIn' é crucial para integrar usuários do OAuth (Google) ao nosso banco de dados.
    async signIn({ user, account, profile }) {
      // Para provedores OAuth como o Google
      if (account?.provider === "google" && user.email) {
        const existingUser = await getUserFromDb(user.email);
        
        // Se o usuário já existe no nosso banco, permite o login.
        if (existingUser) {
          return true;
        }
        
        // Se não existe, cria um novo registro de usuário no nosso banco de dados.
        // Isso unifica todos os usuários (credentials e google) em um só lugar.
        const users = await readData<User>('users');
        const newUser: User = {
          id: user.id, // ID fornecido pelo provedor OAuth
          name: user.name,
          email: user.email,
          image: user.image,
          role: 'Farmacêutico', // Role padrão para novos usuários do Google
          accessLevel: users.length === 0 ? 'Admin' : 'User', // Primeiro usuário é Admin
        };
        await writeData('users', [...users, newUser]);
        
        return true; // Permite o login após criar o usuário.
      }
      
      // Para login com credenciais, a verificação já foi feita no 'authorize'.
      return true;
    },
    
    // O callback 'jwt' é chamado sempre que um token é criado ou atualizado.
    // É essencial para persistir os dados personalizados no banco de dados da sessão ('database' strategy).
    async jwt({ token, user }) {
      // No primeiro login (quando o objeto 'user' está presente),
      // transferimos os dados do usuário para o token.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
        token.accessLevel = user.accessLevel;
        token.image = user.image;
        token.birthdate = user.birthdate;
      }
      // O VercelKVAdapter usará este token enriquecido para criar a entrada da sessão no Vercel KV.
      return token;
    },

    // O callback 'session' constrói o objeto de sessão do lado do cliente.
    // Ele recebe o token (recuperado do Vercel KV pelo adaptador) e o usa para popular a sessão.
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as User['role'];
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.accessLevel = token.accessLevel as User['accessLevel'];
        session.user.image = token.image as string | undefined;
        session.user.birthdate = token.birthdate as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para a página de login em caso de erro.
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
