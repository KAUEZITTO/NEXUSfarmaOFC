
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

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isPublicPage = pathname === '/';
  
  const isAuthenticated = sessionCookie && await verifyToken(sessionCookie);

  if (isAuthenticated) {
    // If authenticated, and trying to access login/register, redirect to dashboard
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Allow access to all other pages
    return NextResponse.next();
  }

  // If not authenticated
  // Allow access to public and auth pages
  if (isPublicPage || isAuthPage) {
    return NextResponse.next();
  }

  // For any other protected page, redirect to login
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
