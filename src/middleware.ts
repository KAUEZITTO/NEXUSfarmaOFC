
import { NextResponse, type NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
};

export async function middleware(req: NextRequest) {
  // 1. Verifica o token JWT do cookie
  const verifiedToken = await verifyAuth(req).catch((err) => {
    console.error('Erro na verificação do token no middleware:', err.message);
    return null;
  });

  // 2. Se o token for inválido, redireciona para a página de login
  if (!verifiedToken) {
    // Se o usuário já está na página de login, não faz nada
    if (req.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    // Redireciona para o login, adicionando a URL original para redirecionamento após o sucesso
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Se o token for válido, aplica as regras de acesso baseadas no perfil
  const { pathname } = req.nextUrl;
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
    const allowedHospitalPaths = ['/dashboard/hospital', '/dashboard/inventory', '/dashboard/settings', '/dashboard/about'];
    const isAllowed = allowedHospitalPaths.some(p => pathname.startsWith(p));
    if (!isAllowed) {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }
  } else { // Usuário do CAF
    if (pathname.startsWith('/dashboard/hospital')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Impede que não-coordenadores acessem a tela de seleção de ambiente
  if (!isCoordinator && pathname === '/dashboard/select-location') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Se passou por todas as regras, permite o acesso
  return NextResponse.next();
}
