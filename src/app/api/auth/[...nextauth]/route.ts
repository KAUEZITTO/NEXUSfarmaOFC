
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from "next-auth/providers/google";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';

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
          console.log('Credenciais ausentes');
          return null;
        }

        // A inicialização do Firebase Auth deve ocorrer aqui dentro
        // para garantir que as variáveis de ambiente estejam carregadas.
        const auth = getAuth(firebaseApp);

        try {
          // 1. Autentica o usuário com o Firebase Auth
          const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
          const firebaseUser = userCredential.user;

          if (!firebaseUser) {
            return null;
          }

          // 2. Busca os metadados (cargo, nível de acesso) em nossa base de dados (Vercel KV)
          const users = await readData<User>('users');
          const appUser = users.find(u => u.id === firebaseUser.uid);

          if (!appUser) {
            // Se o usuário existe no Firebase mas não em nosso DB, pode ser um caso de borda.
            // Por segurança, negamos o acesso se for login por credenciais.
            console.log('Usuário autenticado no Firebase, mas não encontrado no banco de dados do app:', firebaseUser.email);
            return null;
          }

          console.log('Usuário autenticado com sucesso:', appUser.email);
          
          // 3. Retorna o objeto do usuário para o NextAuth criar a sessão
          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.role, // Usando role como name para exibição
            role: appUser.role,
            accessLevel: appUser.accessLevel,
          };

        } catch (error) {
          console.error("Firebase sign-in error:", error);
          // Retornar null em qualquer caso de erro é suficiente para o NextAuth.
          return null;
        }
      }
    })
  ],
  callbacks: {
    // Chamado no login para popular o token JWT.
    async jwt({ token, user, account }) {
      // No primeiro login (seja por credenciais ou Google), `user` e `account` estarão presentes.
      if (account && user) {
        const users = await readData<User>('users');
        let appUser = users.find(u => u.id === user.id);

        // Se é um login do Google e o usuário não existe em nosso DB, criamos um registro para ele.
        if (account.provider === 'google' && !appUser && user.email) {
          const isFirstUser = users.length === 0;
          const newUser: User = {
            id: user.id, // O ID vem do objeto 'user' do provedor Google
            email: user.email,
            password: '', // Senha não aplicável para OAuth
            role: 'Coordenador', // Cargo padrão para novos usuários do Google
            accessLevel: isFirstUser ? 'Admin' : 'User',
          };
          
          try {
            await writeData('users', [...users, newUser]);
            appUser = newUser;
            console.log("Novo usuário do Google registrado no DB:", newUser.email);
          } catch (e) {
             console.error("Falha ao registrar novo usuário do Google no KV:", e);
             // Retornar o token sem as informações de role pode causar problemas,
             // mas lançar um erro aqui resultaria em uma falha de login para o usuário.
             // O ideal é logar o erro e permitir que o login continue sem a role.
             return token;
          }
        }
        
        // Adiciona as propriedades do nosso DB (appUser) ao token.
        if (appUser) {
            token.id = appUser.id;
            token.role = appUser.role;
            token.accessLevel = appUser.accessLevel;
        }
      }
      return token;
    },
    // Chamado para criar o objeto de sessão que é exposto ao cliente.
    async session({ session, token }) {
      // Adiciona as propriedades do token ao objeto `session.user`
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
    error: '/login', // Redireciona para /login em caso de erro, com uma query string ?error=
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
