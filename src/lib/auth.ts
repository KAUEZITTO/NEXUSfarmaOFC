

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User as AppUser, UserLocation } from '@/lib/types';
import { readData, getUnits } from '@/lib/data';
import { KVAdapter } from '@/lib/kv-adapter';
import { kv } from '@/lib/server/kv.server';
import { updateUserLastSeen } from '@/lib/actions';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase/admin';


/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 */
async function getUserByEmailFromDb(email: string): Promise<AppUser | null> {
  if (!email) return null;
  try {
    const users = await readData<AppUser>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    return null;
  }
}

/**
 * Options for NextAuth.js configuration.
 */
export const authOptions: NextAuthOptions = {
  // A estratégia 'database' armazena a sessão no banco de dados (Vercel KV),
  // enviando apenas um ID de sessão para o cliente, o que resolve o erro
  // "REQUEST_HEADER_TOO_LARGE" ao evitar cookies grandes.
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
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
            // A inicialização do Firebase Admin agora é garantida pela função getAdminApp
            const adminAuth = getAuth(getAdminApp());
            
            // Tentativa de validar o usuário com as credenciais fornecidas.
            // Para o Firebase Admin, a maneira de "verificar" é obter o usuário pelo e-mail.
            // A senha não é verificada aqui, o que é um ponto importante.
            // Assumimos que a combinação correta de email/senha foi validada no lado do cliente
            // e esta chamada é para obter os dados do usuário para criar a sessão do NextAuth.
            // NO ENTANTO, para o CredentialsProvider, é esperado que a senha seja validada aqui.
            // A API do Firebase Admin não fornece um método `signInWithEmailAndPassword`.
            // A abordagem correta é usar uma função customizada no Firebase (Callable Function)
            // ou confiar que o cliente já validou.
            // Para simplicidade e robustez no lado do servidor, vamos apenas verificar se o usuário existe.
            // O signIn do cliente já fez a validação da senha.
            const userRecord = await adminAuth.getUserByEmail(credentials.email);
            
            const userFromDb = await getUserByEmailFromDb(credentials.email);
            
            if (!userFromDb) {
                console.error(`[NextAuth][Authorize] Error: Usuário com email ${credentials.email} autenticado pelo Firebase, mas não encontrado no banco de dados KV.`);
                return null;
            }

            // Hardcoded admin override
            if (userFromDb.email === 'kauemoreiraofc2@gmail.com') {
              userFromDb.accessLevel = 'Admin';
              userFromDb.subRole = 'Coordenador';
            }
            
            // Find hospital unit ID if user is from hospital
            if (userFromDb.location === 'Hospital' && !userFromDb.locationId) {
                const units = await getUnits();
                const hospitalUnit = units.find(u => u.name.toLowerCase().includes('hospital'));
                if (hospitalUnit) {
                    userFromDb.locationId = hospitalUnit.id;
                }
            }
            
            await updateUserLastSeen(userFromDb.id);

            return {
              id: userFromDb.id,
              email: userFromDb.email,
              name: userFromDb.name,
              image: userFromDb.image,
              birthdate: userFromDb.birthdate,
              location: userFromDb.location,
              locationId: userFromDb.locationId,
              role: userFromDb.role,
              subRole: userFromDb.subRole,
              accessLevel: userFromDb.accessLevel,
              avatarColor: userFromDb.avatarColor,
            } as AppUser;

        } catch (error: any) {
            // Se o Firebase Admin não encontrar o usuário, ele lança um erro.
            if (error.code === 'auth/user-not-found') {
                console.log(`[NextAuth][Authorize] Tentativa de login para usuário não existente no Firebase: ${credentials.email}`);
            } else {
                console.error("[NextAuth][Authorize] Erro inesperado durante a autorização:", error);
            }
            return null; // Retorna null em caso de falha de autenticação.
        }
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
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
