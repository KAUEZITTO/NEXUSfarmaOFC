
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData } from '@/lib/data';
import type { User } from '@/lib/types';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseServerApp } from '@/lib/firebase/server';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

async function getUserFromDb(email: string): Promise<User | null> {
  try {
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Failed to read user data from Vercel KV.", error);
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
          console.error("Authorize Error: Missing credentials.");
          return null;
        }

        try {
          const auth = getAuth(firebaseServerApp);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );
          
          const firebaseUser = userCredential.user;
          if (!firebaseUser?.email) {
             console.error("Authorize Error: Firebase user not found after successful sign-in.");
             return null;
          }

          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            console.error(`Authorize Error: User ${firebaseUser.email} authenticated with Firebase but not found in the application database (Vercel KV).`);
            return null;
          }
          
          // Retorna o objeto de usuário completo. O NextAuth usará isso para criar a sessão/token.
          return appUser;

        } catch (error: any) {
          console.error("Authorize Error: Firebase authentication failed.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Este callback é chamado sempre que um JSON Web Token é criado ou atualizado.
    // É crucial para persistir os dados personalizados no banco de dados da sessão.
    jwt: async ({ token, user }) => {
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
      // O UpstashRedisAdapter usará este token enriquecido para criar a entrada da sessão no Vercel KV.
      return token;
    },

    // Este callback é chamado para construir o objeto de sessão do lado do cliente.
    // Ele recebe o token (recuperado do Vercel KV pelo adaptador) e o usa para popular a sessão.
    session: async ({ session, token }) => {
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
    error: '/login',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
