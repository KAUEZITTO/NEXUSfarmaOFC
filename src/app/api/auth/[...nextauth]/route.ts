
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { readData, writeData } from '@/lib/data';
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
        // Este é o local correto para a lógica de autorização de credenciais.
        const auth = getAuth(firebaseApp);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // 1. Autentica com o Firebase
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          if (userCredential.user) {
            // 2. Busca os dados do nosso banco de dados
            const appUser = await getUserFromDb(credentials.email);

            if (appUser) {
              // 3. Retorna o objeto de usuário completo para o NextAuth
              return {
                id: appUser.id,
                email: appUser.email,
                role: appUser.role,
                accessLevel: appUser.accessLevel,
              };
            }
          }
          return null; // Falha na autenticação do Firebase ou usuário não encontrado no nosso BD.
        } catch (error) {
          console.error("Firebase credentials sign-in error:", error);
          return null; // A autenticação do Firebase falhou.
        }
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
    // Este callback é rápido e não faz chamadas de rede.
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.accessLevel = token.accessLevel;
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
