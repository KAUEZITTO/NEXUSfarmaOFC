
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

async function verifyToken(token: string, secret: Uint8Array): Promise<boolean> {
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
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { pathname } = request.nextUrl;

  const isAuthenticated = sessionCookie ? await verifyToken(sessionCookie, secret) : false;

  // Se o usuário está tentando acessar o dashboard mas não está autenticado,
  // redirecione para o login.
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se o usuário está autenticado e tenta acessar a página de login,
  // redirecione para o dashboard.
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Em todos os outros casos, permite que a requisição prossiga.
  return NextResponse.next();
}

export const config = {
  // O matcher define em quais rotas o middleware será executado.
  // Aqui, ele roda em todas as rotas, exceto nas de API, arquivos estáticos e imagens.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
