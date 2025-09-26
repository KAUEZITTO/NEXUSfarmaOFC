
'use server';

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
    // Se ele tenta acessar uma página de login/registro, redireciona para o dashboard.
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Caso contrário, permite o acesso a qualquer outra página (ex: /dashboard, /inventory).
    return NextResponse.next();
  }

  // Se o usuário NÃO está autenticado
  // Se ele está tentando acessar uma página pública ou uma página de autenticação, permite.
  if (isPublicPage || isAuthPage) {
    return NextResponse.next();
  }

  // Se ele está tentando acessar qualquer outra página protegida, redireciona para o login.
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // Este matcher exclui rotas de API, arquivos estáticos e arquivos de otimização de imagem.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
