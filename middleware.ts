
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// O SDK do Admin não é estritamente necessário para esta abordagem de protótipo,
// pois o Firebase Auth (cliente) e as regras de segurança gerenciam a sessão.
// A verificação do cookie de sessão aqui seria uma camada extra de segurança em um app de produção.
// Por enquanto, vamos simplificar para evitar a necessidade de credenciais de serviço.

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/' || pathname === '/register';

  if (!sessionCookie) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Em um aplicativo de produção completo, você faria a verificação do cookie de sessão aqui
  // usando o Firebase Admin SDK para garantir que o cookie é válido.
  // try {
  //   await getAuth().verifySessionCookie(sessionCookie, true);
  // } catch (error) { ... }
     
  if(isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
