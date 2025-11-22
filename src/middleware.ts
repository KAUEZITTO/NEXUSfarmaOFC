
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
  const isHospitalUser = verifiedToken.location === 'Hospital';

  // O Coordenador nunca deve ser redirecionado automaticamente. Ele tem acesso ao dashboard consolidado.
  if (isCoordinator) {
    return NextResponse.next();
  }

  // Lógica para usuários não-coordenadores
  if (isHospitalUser) {
    // Se for usuário do hospital, restrinja o acesso apenas às rotas do hospital.
    if (!pathname.startsWith('/dashboard/hospital') && !pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/about') && !pathname.startsWith('/dashboard/inventory')) {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }
    // Garante que o inventário do hospital aponte para a localização correta.
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'Hospital');
      return NextResponse.redirect(url);
    }
  } else { // Usuário do CAF
    // Impede o acesso do usuário do CAF às rotas do hospital.
    if (pathname.startsWith('/dashboard/hospital')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
     // Garante que o inventário do CAF aponte para a localização correta.
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'CAF');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}
