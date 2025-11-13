import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isHospitalUser = token?.location === 'Hospital';

    // Redireciona usuários do Hospital que tentam acessar a raiz do dashboard ou outras páginas do CAF
    if (isHospitalUser && !pathname.startsWith('/dashboard/hospital') && pathname !== '/dashboard/inventory' && pathname !== '/dashboard/settings' && pathname !== '/dashboard/about') {
      return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
    }

    // Redireciona usuários do CAF que tentam acessar as páginas do hospital
    if (!isHospitalUser && pathname.startsWith('/dashboard/hospital')) {
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
