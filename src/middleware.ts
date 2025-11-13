import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isHospitalUser = token?.location === 'Hospital';
    const isCoordinator = token?.subRole === 'Coordenador';

    // Se for Coordenador, permitir acesso a tudo e direcionar para a seleção se o path for o root do dashboard
    if (isCoordinator) {
      if (pathname === '/dashboard') {
         return NextResponse.redirect(new URL('/dashboard/select-location', req.url));
      }
      return NextResponse.next();
    }

    // Redireciona usuários do Hospital que tentam acessar a raiz do dashboard ou outras páginas do CAF
    if (isHospitalUser && !pathname.startsWith('/dashboard/hospital') && !['/dashboard/inventory', '/dashboard/settings', '/dashboard/about'].includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }

    // Redireciona usuários do CAF que tentam acessar as páginas do hospital
    if (!isHospitalUser && pathname.startsWith('/dashboard/hospital')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
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
