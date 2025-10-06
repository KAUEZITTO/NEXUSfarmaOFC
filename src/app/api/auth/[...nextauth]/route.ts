
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
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
  // Use o UpstashRedisAdapter, que é compatível com a API do Vercel KV.
  adapter: UpstashRedisAdapter(kv),

  // A estratégia 'database' armazena a sessão no Vercel KV e mantém o cookie do cliente pequeno.
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
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

        const auth = getAuth(firebaseApp);

        try {
          // 1. Autentica o usuário no Firebase
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          const firebaseUser = userCredential.user;

          if (!firebaseUser) {
            return null;
          }

          // 2. Busca os dados do usuário do nosso banco de dados (Vercel KV)
          const appUser = await getUserFromDb(firebaseUser.email);
          if (!appUser) {
            return null; // O usuário existe no Firebase, mas não no nosso sistema.
          }
          
          // 3. Retorna o objeto do usuário que o NextAuth usará para criar a sessão no banco de dados.
          // Este objeto completo será salvo na tabela 'users' do Vercel KV pelo adapter.
          return {
            id: appUser.id,
            email: appUser.email,
            name: appUser.name,
            image: appUser.image,
            role: appUser.role,
            subRole: appUser.subRole,
            accessLevel: appUser.accessLevel,
            birthdate: appUser.birthdate
          };
        } catch (error) {
          console.error("Firebase authentication error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // Este callback é chamado sempre que uma sessão é verificada.
    // O objeto `user` já vem do banco de dados (Vercel KV) graças ao adapter.
    async session({ session, user }) {
      if (session.user) {
        // 4. Anexa os dados do usuário do banco de dados ao objeto de sessão.
        // Isso NÃO aumenta o cookie. Os dados são buscados no servidor e retornados ao cliente
        // na chamada de useSession() ou getServerSession().
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.subRole = user.subRole;
        session.user.accessLevel = user.accessLevel;
        session.user.image = user.image;
        session.user.birthdate = user.birthdate;
        
        // Operação secundária: Atualiza o "lastSeen" no KV sem afetar a sessão.
        const users = await readData<User>('users');
        const userIndex = users.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex].lastSeen = new Date().toISOString();
          // Esta operação é "fire-and-forget", não precisa bloquear o retorno.
          writeData('users', users).catch(console.error);
        }
      }
      return session; // Retorna a sessão enriquecida.
    },
  },

  pages: {
    signIn: '/login',
    error: '/login', // Em caso de erro, redireciona para o login.
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
