
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!sessionCookie) {
    // Allow access to the landing page at the root
    if (pathname === '/') {
        return NextResponse.next();
    }
    if (isAuthPage) {
      return NextResponse.next();
    }
    // Redirect non-authenticated users from protected routes to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If user is authenticated and tries to access login/register, redirect to dashboard
  if(isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow access to landing page even if authenticated
  if (pathname === '/') {
      return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
