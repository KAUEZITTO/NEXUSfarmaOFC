
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmailFromDb } from './data';
import type { User as AppUser } from '@/lib/types';
import { adminAuth } from './firebase/admin';


/**
 * Opções de configuração para o NextAuth.js.
 */
export const authOptions: NextAuthOptions = {
  // A estratégia 'jwt' é mais simples e, ao minimizar o conteúdo do token,
  // evitamos o erro 'REQUEST_HEADER_TOO_LARGE'.
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        uid: { label: "UID", type: "text" },
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.uid || !credentials?.email) {
          console.error("[NextAuth][Authorize] Error: UID ou email ausente nas credenciais.");
          return null;
        }

        try {
          // A autenticação da senha já foi feita no cliente com o Firebase.
          // Aqui, apenas garantimos que o usuário existe no nosso banco de dados KV.
          const appUser = await getUserByEmailFromDb(credentials.email);
          
          if (appUser) {
            // Sucesso! Retornamos os dados essenciais para o token.
            return appUser;
          }
          
          // Se o usuário autenticou no Firebase mas não está no nosso DB, algo está muito errado.
          console.error(`[NextAuth][Authorize] Error: Usuário autenticado pelo Firebase (${credentials.email}) não foi encontrado no banco de dados.`);
          // Em cenários de recuperação, podemos tentar criar o usuário aqui.
          // Por agora, negamos o acesso para manter a segurança.
          const userRecord = await adminAuth.getUser(credentials.uid);
          if (userRecord) {
              const newUser: AppUser = {
                id: userRecord.uid,
                email: userRecord.email!,
                name: userRecord.displayName || userRecord.email!.split('@')[0],
                role: 'Farmacêutico', // Papel padrão para recuperação
                accessLevel: 'User'
              };
              // Adicionar ao KV...
              console.log("Usuário recuperado e será adicionado ao KV.");
              return newUser;
          }

          return null;
          
        } catch (error) {
          console.error("[NextAuth][Authorize] Critical Error: Exceção durante a busca do usuário.", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // A callback 'jwt' é chamada sempre que um token é criado ou atualizado.
    // **A SOLUÇÃO CRÍTICA ESTÁ AQUI**: Armazenamos o mínimo de dados possível.
    async jwt({ token, user }) {
        if (user) {
            // 'user' é o objeto retornado pela função 'authorize'.
            const appUser = user as AppUser;
            token.id = appUser.id;
            token.accessLevel = appUser.accessLevel;
            token.role = appUser.role; // Adicionado de volta, é pequeno e útil
            token.subRole = appUser.subRole; // Adicionado de volta, é pequeno e útil
        }
        return token;
    },
    // A callback 'session' é chamada para criar o objeto de sessão do cliente.
    // Ela recebe o token JWT e o transforma no objeto 'session.user'.
    async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            session.user.accessLevel = token.accessLevel as AppUser['accessLevel'];
            session.user.role = token.role as AppUser['role'];
            session.user.subRole = token.subRole as AppUser['subRole'];
            
            // Para outros dados (nome, email, imagem), podemos buscar do DB se necessário,
            // mas geralmente, eles são passados durante o login inicial e já existem na sessão.
            // Para manter a estabilidade, evitamos buscas adicionais aqui.
        }
        return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redireciona para o login em caso de qualquer erro de auth.
  },
};
