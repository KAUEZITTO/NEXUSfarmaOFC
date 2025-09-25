
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

  const isAuthenticated = sessionCookie && await verifyToken(sessionCookie);

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicPage = pathname === '/';

  // If the user is authenticated
  if (isAuthenticated) {
    // If they try to access login/register, redirect them to the dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow them to proceed to the requested page
    return NextResponse.next();
  }

  // If the user is NOT authenticated
  // If they are trying to access a public page or an auth page, allow them
  if (isPublicPage || isAuthPage) {
    return NextResponse.next();
  }

  // If they are trying to access any other protected page, redirect them to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  // This matcher excludes API routes, static files, and image optimization files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
