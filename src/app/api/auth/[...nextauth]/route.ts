
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

// Função dedicada para buscar o usuário no banco de dados
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
  if (!email) return null;
  try {
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
  } catch (error) {
    console.error("Error fetching user from DB:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: UpstashRedisAdapter(kv),
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },
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
          console.error("Authorize: Missing credentials");
          return null;
        }

        try {
          // Garante que a instância de autenticação seja obtida de forma estável
          const auth = getAuth(firebaseApp);
          
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          if (!firebaseUser || !firebaseUser.email) {
             console.error("Authorize: Firebase user not found after sign-in.");
             return null;
          }

          // Após o sucesso do Firebase, busca o usuário no nosso banco de dados
          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`Authorize: User ${firebaseUser.email} authenticated with Firebase but not found in app DB.`);
            return null;
          }
          
          // Retorna o objeto completo do nosso banco de dados.
          // O NextAuth (com o adaptador) cuidará de salvar a sessão.
          return appUser;

        } catch (error: any) {
          // Log detalhado do erro do Firebase no servidor
          console.error("Authorize: Firebase authentication error:", error.code, error.message);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // O 'user' aqui vem do banco de dados da sessão (Vercel KV), graças ao adaptador.
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.subRole = user.subRole;
        session.user.accessLevel = user.accessLevel;
        session.user.image = user.image;
        session.user.birthdate = user.birthdate;
        session.user.name = user.name;
        session.user.email = user.email;
        
        // Atualiza a 'última visualização' do usuário de forma assíncrona
        try {
            const users = await readData<User>('users');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
              users[userIndex].lastSeen = new Date().toISOString();
              // A escrita não precisa ser aguardada para não bloquear a resposta da sessão
              writeData('users', users).catch(console.error);
            }
        } catch (dbError) {
            console.error("Session Callback: Failed to update lastSeen:", dbError);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de erro, com ?error=... na URL
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
