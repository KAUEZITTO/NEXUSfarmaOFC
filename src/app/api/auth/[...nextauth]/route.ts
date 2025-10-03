
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
import bcrypt from 'bcrypt';

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

        // 1. Busca o usuário no nosso banco de dados Vercel KV
        const appUser = await getUserFromDb(credentials.email);

        // 2. Se o usuário não existe no nosso BD, a autorização falha.
        if (!appUser) {
            console.log("User not found in our DB");
            return null;
        }
        
        // 3. Se o usuário não tem uma senha hash (ex: foi criado via Google), não pode logar com senha.
        if (!appUser.password) {
            console.log("User exists but has no password hash (likely Google user)");
            return null;
        }
        
        // 4. Compara a senha fornecida com o hash armazenado usando bcrypt.
        const passwordsMatch = await bcrypt.compare(credentials.password, appUser.password);

        if (passwordsMatch) {
            // 5. Se as senhas correspondem, retorna o objeto de usuário para o NextAuth.
            return {
                id: appUser.id,
                email: appUser.email,
                role: appUser.role,
                accessLevel: appUser.accessLevel,
            };
        }
        
        // Se as senhas não correspondem, retorna nulo.
        console.log("Password mismatch");
        return null;
      }
    })
  ],
  callbacks: {
    // O callback signIn é o local ideal para lidar com a criação de usuário após um login OAuth.
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
          try {
            let appUser = await getUserFromDb(user.email);
            
            // Se o usuário do Google não existir no nosso banco de dados, crie-o agora.
            if (!appUser) {
                const users = await readData<User>('users');
                const isFirstUser = users.length === 0;
                const newUser: User = {
                    id: user.id, // Usa o ID do Google
                    email: user.email,
                    password: '', // Sem senha para usuários do Google
                    role: 'Coordenador', // Cargo padrão para novos usuários do Google
                    accessLevel: isFirstUser ? 'Admin' : 'User', // O primeiro usuário é Admin
                };
                await writeData('users', [...users, newUser]);
                console.log("New Google user created in DB:", newUser.email);
            }
          } catch (error) {
              console.error("Error during Google sign-in DB check/creation:", error);
              return false; // Impede o login se houver um erro de banco de dados.
          }
      }
      return true; // Continua o processo de login.
    },

    // O callback jwt é chamado DEPOIS do authorize ou do signIn.
    // Sua principal função é popular o token JWT.
    async jwt({ token, user }) {
      // No primeiro login (objeto `user` está presente), buscamos os dados do nosso BD.
      if (user?.email) {
        const appUser = await getUserFromDb(user.email);
        if (appUser) {
            token.id = appUser.id;
            token.role = appUser.role;
            token.accessLevel = appUser.accessLevel;
        }
      }
      return token;
    },

    // O callback session usa os dados do token para construir o objeto de sessão do cliente.
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
    error: '/login', // Em caso de erro, redireciona para a página de login com um parâmetro de erro.
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
