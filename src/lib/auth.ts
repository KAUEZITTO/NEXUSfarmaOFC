import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen, validateAndGetUser, verifyUserPassword } from '@/lib/actions';
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
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                return null;
            }

            try {
                // 1. Validar a senha com o Firebase Admin no backend
                const isPasswordValid = await verifyUserPassword(credentials.email, credentials.password);
                if (!isPasswordValid) {
                    return null; // Senha incorreta
                }

                // 2. Se a senha for válida, buscar os dados do usuário no KV
                const user = await validateAndGetUser(credentials.email);
                if (!user) {
                    return null; // Usuário não encontrado no DB do NexusFarma
                }
                
                // 3. Retornar o objeto de usuário para o NextAuth
                return user;

            } catch (error) {
                console.error("Authorization Error:", error);
                return null;
            }
        },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        if (user) {
            token.id = user.id;
            token.name = user.name;
            token.email = user.email;
            token.location = (user as AppUser).location;
            token.locationId = (user as AppUser).locationId;
            token.accessLevel = (user as AppUser).accessLevel;
            token.role = (user as AppUser).role;
            token.subRole = (user as AppUser).subRole;
            token.birthdate = (user as AppUser).birthdate;
            token.avatarColor = (user as AppUser).avatarColor;
        }
        if (trigger === "update" && session?.user) {
            token.name = session.user.name;
            token.birthdate = session.user.birthdate;
            token.avatarColor = session.user.avatarColor;
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
