
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
import { SignJWT, jwtVerify } from 'jose';
import { TextEncoder } from 'util';

// Função auxiliar para buscar um usuário no nosso banco de dados (Vercel KV)
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
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
          return null;
        }

        const appUser = await getUserFromDb(credentials.email);

        if (!appUser || !appUser.password) {
            return null;
        }
        
        // Simular a verificação de senha com 'jose'
        // Como não temos a senha original para comparar, vamos assumir que o hash é a própria senha.
        // A lógica de registro precisa ser ajustada para criar um hash compatível ou uma verificação diferente.
        // **Isto é uma simplificação e NÃO é seguro para produção real sem uma lógica de hash adequada.**
        // A comparação real deve ser feita com uma biblioteca de hash como argon2 ou scrypt, ou um serviço de autenticação.
        
        // Para a finalidade deste app, vamos comparar a senha digitada com a armazenada,
        // pois a lógica de hash com bcrypt foi removida.
        const passwordsMatch = credentials.password === appUser.password;

        if (passwordsMatch) {
            return {
                id: appUser.id,
                email: appUser.email,
                role: appUser.role,
                accessLevel: appUser.accessLevel,
            };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
          try {
            let appUser = await getUserFromDb(user.email);
            
            if (!appUser) {
                const users = await readData<User>('users');
                const isFirstUser = users.length === 0;
                const newUser: User = {
                    id: user.id,
                    email: user.email,
                    // Não armazenamos senha para usuários do Google
                    role: 'Coordenador', 
                    accessLevel: isFirstUser ? 'Admin' : 'User',
                };
                await writeData('users', [...users, newUser]);
            }
          } catch (error) {
              console.error("Error during Google sign-in DB check/creation:", error);
              return false;
          }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Ao logar, buscamos os dados do nosso banco e os colocamos no token
        const appUser = await getUserFromDb(user.email);
        if (appUser) {
            token.id = appUser.id;
            token.role = appUser.role;
            token.accessLevel = appUser.accessLevel;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.accessLevel = token.accessLevel as any;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

