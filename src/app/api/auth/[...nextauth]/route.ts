
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
  if (!email) return null;
  const users = await readData<User>('users');
  return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  // 1. O adaptador garante que usuários e sessões sejam salvos no Vercel KV.
  adapter: UpstashRedisAdapter(kv),

  // 2. A estratégia 'database' é a chave. Ela instrui o NextAuth a não usar JWTs
  // para a sessão do cliente, armazenando apenas um ID de sessão no cookie.
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  },

  // 3. Configuração explícita e segura para os cookies.
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // O domínio deve ser configurado para produção para funcionar em subdomínios
        // domain: process.env.NODE_ENV === 'production' ? '.nexusfarma.online' : 'localhost'
      },
    },
  },

  // 4. Secret é obrigatório para assinar os cookies de sessão.
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
          return null;
        }

        const auth = getAuth(firebaseApp);

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const firebaseUser = userCredential.user;

          if (!firebaseUser) return null;

          const appUser = await getUserFromDb(firebaseUser.email);
          if (!appUser) return null;
          
          // O objeto retornado aqui é o que o adaptador salvará na tabela 'users' do KV.
          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.name,
            image: appUser.image,
            role: appUser.role,
            subRole: appUser.subRole,
            accessLevel: appUser.accessLevel,
            birthdate: appUser.birthdate,
          };
        } catch (error) {
          console.error("Firebase authentication error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // 5. O callback 'session' é chamado para CADA request que usa useSession() ou getServerSession().
    // O objeto 'user' aqui já vem do Vercel KV, graças ao adaptador.
    async session({ session, user }) {
      // O trabalho deste callback é apenas mapear os dados do usuário do banco (objeto `user`)
      // para o objeto `session` que será exposto ao cliente. ISSO NÃO AUMENTA O COOKIE.
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.subRole = user.subRole;
        session.user.accessLevel = user.accessLevel;
        session.user.image = user.image;
        session.user.birthdate = user.birthdate;
        
        // Operação secundária: Atualiza o "lastSeen" no KV sem afetar a sessão.
        // É uma operação "fire-and-forget" que não precisa bloquear o retorno.
        const users = await readData<User>('users');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex].lastSeen = new Date().toISOString();
          writeData('users', users).catch(console.error);
        }
      }
      return session; // Retorna a sessão enriquecida, que o NextAuth disponibilizará ao cliente.
    },
    // O callback 'jwt' NÃO é chamado quando a estratégia de sessão é 'database'.
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
