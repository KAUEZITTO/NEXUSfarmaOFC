
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isHospitalUser = token?.location === 'Hospital';
    const isCoordinator = token?.subRole === 'Coordenador';

    // Coordinators can access everything.
    if (isCoordinator) {
      if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL('/dashboard/select-location', req.url));
      }
      return NextResponse.next();
    }

    // --- Rules for non-coordinators ---

    // Hospital User: Access restricted to hospital area, global inventory, settings, and about.
    if (isHospitalUser) {
        const allowedHospitalPaths = ['/dashboard/hospital', '/dashboard/inventory', '/dashboard/settings', '/dashboard/about'];
        const isAllowed = allowedHospitalPaths.some(p => pathname.startsWith(p));
        if (!isAllowed) {
            return NextResponse.redirect(new URL('/dashboard/hospital', req.url));
        }
    }
    
    // CAF User: Access restricted to CAF area, global inventory, settings, and about.
    if (!isHospitalUser) {
        if (pathname.startsWith('/dashboard/hospital')) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    // Redirect non-coordinators trying to access the environment selection screen.
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
