
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Este handler agora gerencia apenas provedores de OAuth (se houver) e a sessão JWT
// para usuários já logados. O login com credenciais foi movido para uma Server Action.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
