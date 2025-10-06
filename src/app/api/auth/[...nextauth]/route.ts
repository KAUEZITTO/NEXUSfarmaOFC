
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';
import * as jose from 'jose';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { kv } from "@/lib/kv";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";

// Função auxiliar para buscar um usuário no nosso banco de dados (Vercel KV)
async function getUserFromDb(email: string | null | undefined): Promise<User | null> {
    if (!email) return null;
    const users = await readData<User>('users');
    return users.find(u => u.email === email) || null;
}

export const authOptions: NextAuthOptions = {
  // Use Vercel KV (via Upstash Redis adapter) para armazenar os dados da sessão.
  // Isso mantém o cookie pequeno, contendo apenas um ID de sessão.
  adapter: UpstashRedisAdapter(kv),
  session: {
    // Use a estratégia "database" para armazenar as sessões no Vercel KV.
    strategy: 'database',
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
            // 1. Autenticar com o Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
            const firebaseUser = userCredential.user;

            if (firebaseUser) {
                // 2. Buscar dados adicionais do usuário do nosso banco de dados Vercel KV
                const appUser = await getUserFromDb(firebaseUser.email);
                
                if (appUser) {
                     // 3. Retornar o objeto de usuário completo. O adaptador NextAuth cuidará da criação da sessão.
                     return {
                        id: appUser.id,
                        email: appUser.email,
                        name: appUser.name,
                        image: appUser.image,
                        birthdate: appUser.birthdate,
                        role: appUser.role,
                        subRole: appUser.subRole,
                        accessLevel: appUser.accessLevel,
                    };
                }
            }
            // Se o usuário não for encontrado no Firebase ou no nosso DB, retorna nulo
            return null;

        } catch (error) {
            console.error("Firebase authentication error:", error);
            // Isso irá capturar erros como senha incorreta, usuário não encontrado, etc.
            return null;
        }
      }
    })
  ],
  callbacks: {
    // Com a estratégia 'database', o objeto `user` neste callback é o que foi retornado
    // pelo `authorize` e armazenado no banco de dados pela primeira vez.
    // Em requisições subsequentes, é o usuário lido do banco de dados.
    async session({ session, user }) {
        if (user && session.user) {
            // O objeto `user` já contém os dados do nosso banco de dados.
            // Apenas precisamos passá-los para o objeto `session.user`.
            session.user.id = user.id;
            session.user.name = user.name;
            session.user.image = user.image;
            session.user.birthdate = user.birthdate;
            session.user.role = user.role;
            session.user.subRole = user.subRole;
            session.user.accessLevel = user.accessLevel;
            
            // A lógica de `lastSeen` pode permanecer, pois é uma operação de escrita no DB
            // e não afeta o tamanho do cookie da sessão.
            const users = await readData<User>('users');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].lastSeen = new Date().toISOString();
                await writeData('users', users);
                session.user.lastSeen = users[userIndex].lastSeen;
            }
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
