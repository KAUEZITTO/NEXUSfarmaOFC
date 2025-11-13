import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isHospitalUser = token?.location === 'Hospital';
    const isCoordinator = token?.subRole === 'Coordenador';

    // Coordenadores podem acessar tudo, mas são direcionados para a seleção de ambiente
    if (isCoordinator) {
      if (pathname === '/dashboard') {
         return NextResponse.redirect(new URL('/dashboard/select-location', req.url));
      }
      return NextResponse.next();
    }

    // Usuário do Hospital: Acesso restrito
    if (isHospitalUser) {
        const allowedHospitalPaths = ['/dashboard/hospital', '/dashboard/inventory', '/dashboard/settings', '/dashboard/about'];
        const isAllowed = allowedHospitalPaths.some(p => pathname.startsWith(p));
        if (!isAllowed) {
            return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
        }
    }
    
    // Usuário do CAF: Acesso restrito
    if (!isHospitalUser) {
        if (pathname.startsWith('/dashboard/hospital')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    // Redireciona usuários não-coordenadores que tentam acessar a tela de seleção
    if (!isCoordinator && pathname === '/dashboard/select-location') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { 
  matcher: [
    "/dashboard/:path*",
  ] 
};
