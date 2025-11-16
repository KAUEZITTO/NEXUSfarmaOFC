
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';

// Esta função agora é o único ponto de busca de usuário no banco de dados.
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Failed to read user data from Vercel KV.", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: KVAdapter(kv),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error("[NextAuth][Authorize] Error: Email or password not provided.");
          return null;
        }

        // Etapa 1: Verificar a senha com a API REST de autenticação do Firebase.
        // Este é o método seguro para validar uma senha no backend.
        const firebaseAuthUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;
        
        try {
          const response = await fetch(firebaseAuthUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              returnSecureToken: true,
            }),
          });
          
          if (!response.ok) {
            // Se a resposta não for 2xx, as credenciais são inválidas.
            console.warn(`[NextAuth][Authorize] Firebase auth failed for ${credentials.email} with status: ${response.status}`);
            return null; // Retorna null, o que resulta em um erro de 'CredentialsSignin'.
          }
        } catch (error) {
            console.error("[NextAuth][Authorize] Network error during Firebase auth check:", error);
            // Retorna null em caso de erro de rede ou falha na chamada.
            return null;
        }

        // Etapa 2: Se a autenticação do Firebase foi bem-sucedida, busque os dados do usuário no seu banco de dados (KV).
        const userFromDb = await getUserByEmailFromDb(credentials.email);
        
        if (!userFromDb) {
          console.error(`[NextAuth][Authorize] Error: User ${credentials.email} authenticated via Firebase but not found in KV database.`);
          return null;
        }
        
        // **A CORREÇÃO CRÍTICA**: Nunca retorne o objeto completo do banco de dados se ele contiver a senha.
        // Crie um novo objeto limpo para a sessão.
        const { password, ...userForSession } = userFromDb;

        // Lógica de superusuário
        if (userForSession.email === 'kauemoreiraofc2@gmail.com') {
          userForSession.accessLevel = 'Admin';
          userForSession.subRole = 'Coordenador';
        }
        
        // Garante que o usuário do hospital tenha o ID da localização.
        if (userForSession.location === 'Hospital' && !userForSession.locationId) {
            const units = await getUnits();
            const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
            if (hospitalUnit) {
                userForSession.locationId = hospitalUnit.id;
            }
        }

        // Retorna o objeto limpo para o NextAuth criar a sessão.
        return userForSession;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
        if (session.user) {
            session.user.id = user.id;
            session.user.location = user.location;
            session.user.locationId = user.locationId;
            session.user.accessLevel = user.accessLevel;
            session.user.role = user.role;
            session.user.subRole = user.subRole;
            session.user.name = user.name;
            session.user.birthdate = user.birthdate;
            session.user.avatarColor = user.avatarColor;
            
            if (user.id) {
               await updateUserLastSeen(user.id);
            }
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para /login em caso de qualquer erro, incluindo 'Configuration'
  },
};
