import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { updateUserLastSeen, validateAndGetUser } from '@/lib/actions';
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
        },
        // A função authorize foi removida para usar o fluxo de JWT.
        // A validação agora acontece no callback jwt.
        async authorize(credentials) {
           if (!credentials?.email) {
                console.error("[NextAuth][Authorize] No email provided.");
                return null;
            }
            // Apenas retornamos um objeto mínimo, o callback `jwt` fará o trabalho pesado.
            return { email: credentials.email, id: credentials.email };
        }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
        // Na primeira chamada (após o signIn bem-sucedido no cliente)
        if (account && user) {
            const appUser = await validateAndGetUser(user.email!);
            if (appUser) {
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
        }
        
        // Em chamadas subsequentes, o token já terá os dados
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
