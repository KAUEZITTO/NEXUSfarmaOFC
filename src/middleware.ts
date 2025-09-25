
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jose.jwtVerify(token, secret);
    return true;
  } catch (e) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!sessionCookie || !(await verifyToken(sessionCookie))) {
    // Permitir acesso à página inicial na raiz
    if (pathname === '/') {
        return NextResponse.next();
    }
    // Permitir acesso às páginas de autenticação se não estiver logado
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Redirecionar usuários não autenticados de rotas protegidas para o login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Se o usuário estiver autenticado e tentar acessar login/registro, redirecione para o dashboard
  if(isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Permitir acesso à página inicial mesmo se autenticado
  if (pathname === '/') {
      return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
