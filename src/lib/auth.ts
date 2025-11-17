
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateAndGetUser } from '@/lib/actions';
import { updateUserLastSeen } from '@/lib/actions';
import type { User as AppUser } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    // O CredentialsProvider agora é usado apenas como um gatilho para o nosso fluxo customizado.
    // A validação real da senha já aconteceu no cliente com o Firebase SDK.
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "text" },
        },
        async authorize(credentials) {
            if (!credentials?.email) {
                console.error("[NextAuth][Authorize] Email não fornecido.");
                return null;
            }
            // A senha já foi validada no cliente.
            // Aqui, apenas retornamos um objeto mínimo para que o fluxo continue para o callback 'jwt'.
            return { email: credentials.email, id: '' }; // O ID será preenchido no callback 'jwt'.
        },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
        // 'user' está presente na primeira vez que o usuário faz login.
        // O email vem da função 'authorize'.
        if (user?.email) {
            const appUser = await validateAndGetUser(user.email);
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
        // Se a sessão for atualizada (ex: pelo update do user-nav), atualizamos o token.
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
