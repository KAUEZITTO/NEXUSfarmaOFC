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

  // Paths that are public and don't require authentication
  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/receipt', '/dispensation-receipt', '/labels', '/patient-record'];
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 1. Verifica o token JWT do cookie
  let verifiedToken;
  try {
    verifiedToken = await verifyAuth(req);
  } catch (err) {
    // Se a verificação falhar, redireciona para o login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se não houver token, também redireciona
  if (!verifiedToken) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Se o token for válido, aplica as regras de acesso baseadas no perfil
  const isHospitalUser = verifiedToken.location === 'Hospital';
  const isCoordinator = verifiedToken.subRole === 'Coordenador';

  // Coordenadores podem acessar tudo
  if (isCoordinator) {
    // Mas se tentarem acessar a raiz do dashboard, são levados à tela de seleção de ambiente
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/select-location', req.url));
    }
    return NextResponse.next();
  }

  // Regras para usuários não-coordenadores
  if (isHospitalUser) {
    // Se um usuário do hospital tentar acessar uma rota que não seja do hospital, redirecione para o dashboard do hospital
    if (!pathname.startsWith('/dashboard/hospital') && !pathname.startsWith('/dashboard/settings') && !pathname.startsWith('/dashboard/about') && !pathname.startsWith('/dashboard/inventory')) {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }
     // O usuário do hospital pode ver o inventário, mas forçamos o filtro para 'Hospital'
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'Hospital');
      return NextResponse.redirect(url);
    }
    
  } else { // Usuário do CAF
    // Impede que usuários do CAF acessem rotas do hospital
    if (pathname.startsWith('/dashboard/hospital')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
     // O usuário do CAF pode ver o inventário, mas forçamos o filtro para 'CAF' se nenhum for especificado
    if (pathname.startsWith('/dashboard/inventory') && !req.nextUrl.searchParams.has('location')) {
      const url = req.nextUrl.clone();
      url.searchParams.set('location', 'CAF');
      return NextResponse.redirect(url);
    }
  }

  // Impede que não-coordenadores acessem a tela de seleção de ambiente
  if (!isCoordinator && pathname === '/dashboard/select-location') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Se passou por todas as regras, permite o acesso
  return NextResponse.next();
}
