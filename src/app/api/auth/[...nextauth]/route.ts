
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Este handler é mantido para compatibilidade com o useSession no lado do cliente,
// mas o fluxo principal de login/logout agora é manual via Server Actions e cookies JWT.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
