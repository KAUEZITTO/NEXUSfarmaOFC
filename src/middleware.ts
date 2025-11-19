import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (the login page)
     * - register (the register page)
     * - forgot-password (the forgot password page)
     * - reset-password (the reset password page)
     * - / (the root landing page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|/$).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/receipt', '/dispensation-receipt', '/labels', '/patient-record'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  let verifiedToken;
  try {
    verifiedToken = await verifyAuth(req);
  } catch (err) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!verifiedToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isCoordinator = verifiedToken.subRole === 'Coordenador';

  // **Otimização Crítica**: Verificar e redirecionar o Coordenador ANTES de qualquer outra lógica.
  // Isso previne o carregamento desnecessário da página /dashboard.
  if (isCoordinator && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/select-location', req.url));
  }

  const isHospitalUser = verifiedToken.location === 'Hospital';

  if (isCoordinator) {
    return NextResponse.next();
  }

  if (isHospitalUser) {
    if (!pathname.startsWith('/dashboard/hospital') && !pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/about') && !pathname.startsWith('/dashboard/inventory')) {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'Hospital');
      return NextResponse.redirect(url);
    }
    
  } else { // Usuário do CAF
    if (pathname.startsWith('/dashboard/hospital')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'CAF');
      return NextResponse.redirect(url);
    }
  }

  if (!isCoordinator && pathname === '/dashboard/select-location') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}
