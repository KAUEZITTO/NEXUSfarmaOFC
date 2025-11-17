
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser, verifyUserPassword } from '@/lib/actions';
import { updateUserLastSeen } from '@/lib/actions';
import type { User as AppUser } from '@/lib/types';


export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                console.error("Authorize: Email ou senha não fornecidos.");
                return null;
            }

            try {
                // Passo 1: Verificar a senha com o Firebase Admin SDK (no servidor)
                const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
                
                if (!isPasswordValid) {
                    console.log(`Authorize: Senha inválida para o email: ${credentials.email}`);
                    return null; // Senha incorreta
                }

                // Passo 2: Se a senha for válida, buscar os dados do usuário no nosso banco de dados
                const user = await validateAndGetUser(credentials.email);

                if (user) {
                    return user; // Retorna o objeto de usuário para o NextAuth
                } else {
                    console.log(`Authorize: Usuário autenticado pelo Firebase, mas não encontrado no DB: ${credentials.email}`);
                    return null; // Usuário não encontrado no nosso DB
                }

            } catch (error) {
                console.error("Erro crítico na função authorize:", error);
                return null;
            }
        },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        // Na primeira vez que o usuário faz login (quando `user` está presente),
        // o objeto `user` vem da função `authorize`.
        if (user) {
            const appUser = user as AppUser;
            token.id = appUser.id;
            token.name = appUser.name;
            token.email = appUser.email;
            token.location = appUser.location;
            token.locationId = appUser.locationId;
            token.accessLevel = appUser.accessLevel;
            token.role = appUser.role;
            token.subRole = appUser.subRole;
            token.birthdate = appUser.birthdate;
            token.avatarColor = appUser.avatarColor;
        }
        return token;
    },
    async session({ session, token }) {
        if (session.user && token.id) {
            session.user.id = token.id as string;
            session.user.location = token.location as any;
            session.user.locationId = token.locationId as string;
            session.user.accessLevel = token.accessLevel as any;
            session.user.role = token.role as any;
            session.user.subRole = token.subRole as any;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.birthdate = token.birthdate as string;
            session.user.avatarColor = token.avatarColor as string;

            if (token.id) {
               await updateUserLastSeen(token.id as string);
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
