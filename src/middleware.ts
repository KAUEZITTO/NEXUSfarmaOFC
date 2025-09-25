
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // A autenticação está temporariamente desativada para facilitar o desenvolvimento.
  // Todas as rotas estão acessíveis.
  return NextResponse.next();
}

export const config = {
  // O matcher ainda observa as rotas, mas o middleware agora permite tudo.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
