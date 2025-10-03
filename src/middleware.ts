
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, secret);
    return true;
  } catch (e) {
    console.error("Token verification failed in middleware:", e);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthenticated = sessionCookie && await verifyToken(sessionCookie);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicPage = pathname === '/';

  // Se o usuário está autenticado
  if (isAuthenticated) {
    // Se eles tentam acessar uma página de login/registro, redirecione para o dashboard.
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Caso contrário, permita o acesso a qualquer outra página (ex: /dashboard, /inventory).
    return NextResponse.next();
  }

  // Se o usuário NÃO está autenticado
  // Se eles estão tentando acessar uma página pública ou de autenticação, permita.
  if (isPublicPage || isAuthPage) {
    return NextResponse.next();
  }

  // Se eles estão tentando acessar qualquer outra página protegida, redirecione para o login.
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Este matcher exclui rotas de API, arquivos estáticos e arquivos de otimização de imagem.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};

    