
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { readData, getUnits } from '@/lib/data';
import { updateUserLastSeen, validateAndGetUser } from '@/lib/actions';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt', // Revertido para JWT, que é o padrão e mais estável com callbacks
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          // O formulário de login agora passa apenas o email para o signIn
          email: { label: "Email", type: "text" },
          // A senha é validada no cliente e não é enviada para este provider
        },
        async authorize(credentials) {
            // Esta função agora apenas atua como uma ponte.
            // A validação real acontece no login-form e no callback jwt.
            // Retornamos um objeto temporário que será usado no callback jwt.
            if (!credentials?.email) return null;
            
            // Apenas para satisfazer a função authorize. O objeto real será construído no callback 'jwt'.
            return { id: `temp-${credentials.email}`, email: credentials.email };
        },
    }),
  ],
  callbacks: {
    // O callback 'jwt' é chamado ANTES do callback 'session'.
    // Ele é o responsável por buscar os dados do usuário e construir o token.
    async jwt({ token, user }) {
        // Na primeira vez que o usuário faz login (quando `user` está presente),
        // buscamos os dados completos no banco de dados.
        if (user && user.email) {
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
        return token;
    },
    // O callback 'session' é chamado DEPOIS do 'jwt'.
    // Ele recebe os dados do token e os repassa para a sessão do cliente.
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

            // Atualiza o 'lastSeen' do usuário no banco de dados a cada sessão
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
