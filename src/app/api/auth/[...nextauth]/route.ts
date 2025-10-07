
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getAuth, signInWithEmailAndPassword, getUserByEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { adminAuth } from '@/lib/firebase/admin';

import { readData, writeData } from '@/lib/data';
import { firebaseServerApp } from '@/lib/firebase/server';
import type { User } from '@/lib/types';


/**
 * Busca um usuário no nosso banco de dados (Vercel KV) pelo email.
 * Centraliza a lógica de leitura e tratamento de erros.
 */
async function getUserFromDb(email: string): Promise<User | null> {
  if (!email) return null;
  try {
    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);
    return user || null;
  } catch (error) {
    console.error("CRITICAL: Falha ao ler dados do usuário do Vercel KV.", error);
    // Em caso de falha de leitura do banco, o login deve ser impedido.
    return null;
  }
}

/**
 * Garante que um usuário exista no Firebase Auth e retorna seu UID.
 * Se não existir, cria um novo usuário.
 */
async function getFirebaseUidByEmail(email: string, name?: string | null): Promise<string> {
    try {
        const userRecord = await adminAuth.getUserByEmail(email);
        return userRecord.uid;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.log(`Usuário ${email} não encontrado no Firebase Auth. Criando um novo...`);
            const newUserRecord = await adminAuth.createUser({
                email: email,
                displayName: name || email.split('@')[0],
                // Senha aleatória para usuários OAuth, eles não farão login com ela.
                password: Math.random().toString(36).slice(-8), 
            });
            return newUserRecord.uid;
        }
        throw error; // Lança outros erros
    }
}


export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' armazena a sessão em um cookie criptografado.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
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
          console.error("Authorize Error: Credenciais ausentes.");
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
             console.error("Authorize Error: Usuário Firebase não encontrado após login bem-sucedido.");
             return null;
          }

          // **A CORREÇÃO DEFINITIVA ESTÁ AQUI**
          // Se o Firebase autenticou, nós CONFIAMOS nele.
          // Buscamos o usuário no nosso banco de dados APENAS para enriquecer o perfil com dados como role e accessLevel.
          const appUser = await getUserFromDb(firebaseUser.email);
          
          if (!appUser) {
            // Este é um caso grave: usuário existe no Firebase Auth mas não no nosso banco.
            // Logamos o erro mas ainda permitimos o login com os dados básicos para não travar o usuário.
            console.error(`CRITICAL: User ${firebaseUser.email} authenticated with Firebase but not found in the application database.`);
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              role: 'Farmacêutico', // Role padrão
              accessLevel: 'User', // Nível de acesso padrão
            };
          }
          
          // Retorna o objeto de usuário completo do nosso banco de dados.
          // Isso garante que role, accessLevel, etc., sejam passados corretamente para a sessão.
          return appUser;

        } catch (error: any) {
          // A única vez que isso deve falhar é se a senha estiver realmente errada no Firebase.
          console.error("Authorize Error: Falha na autenticação com Firebase.", {
            errorCode: error.code,
            errorMessage: error.message,
          });
          return null; // Retorna null para indicar "Credenciais Inválidas"
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
            // Garante que o usuário existe no Firebase Auth e obtém o UID.
            const firebaseUid = await getFirebaseUidByEmail(user.email, user.name);
            
            // **CORREÇÃO DE CONSISTÊNCIA**
            // Garante que o ID do usuário na sessão é SEMPRE o UID do Firebase.
            user.id = firebaseUid; 
            
            const existingUser = await getUserFromDb(user.email);
            
            if (existingUser) {
              // Se o usuário já existe, apenas garante que o ID está correto.
              if (existingUser.id !== firebaseUid) {
                 console.warn(`Inconsistência de ID corrigida para ${user.email}.`);
                 const allUsers = await readData<User>('users');
                 const userIndex = allUsers.findIndex(u => u.email === user.email);
                 if (userIndex !== -1) {
                    allUsers[userIndex].id = firebaseUid;
                    await writeData('users', allUsers);
                 }
              }
              return true;
            }
            
            // Se o usuário não existe no nosso banco, cria um novo.
            const users = await readData<User>('users');
            const newUser: User = {
              id: firebaseUid, // USA O UID DO FIREBASE
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'Farmacêutico', 
              accessLevel: users.length === 0 ? 'Admin' : 'User',
            };
            await writeData('users', [...users, newUser]);
            
            return true;
        } catch (error) {
            console.error("Erro crítico no signIn com Google:", error);
            return false; // Impede o login se houver erro
        }
      }
      
      // Para o fluxo de credenciais, o authorize já fez o trabalho.
      return true;
    },
    
    async jwt({ token, user }) {
      // No primeiro login (objeto 'user' está presente), enriquece o token.
      if (user) {
        const appUser = await getUserFromDb(user.email!);
        if (appUser) {
            token.id = appUser.id; // Garante o ID do nosso DB (que deve ser o UID do Firebase)
            token.role = appUser.role;
            token.name = appUser.name;
            token.email = appUser.email;
            token.accessLevel = appUser.accessLevel;
            token.image = appUser.image;
            token.birthdate = appUser.birthdate;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // A cada carregamento de página, popula a sessão com os dados do token.
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

    