
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData } from '@/lib/data';
import { User } from '@/lib/types';

// Função auxiliar para buscar um usuário no nosso banco de dados (Vercel KV)
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
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
        
        // **Isto é uma simplificação e NÃO é seguro para produção real sem uma lógica de hash adequada.**
        // A comparação real deve ser feita com uma biblioteca de hash como bcrypt ou argon2.
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
