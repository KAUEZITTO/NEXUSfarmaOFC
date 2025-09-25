
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // START: TEMPORARY BYPASS FOR DEVELOPMENT
  // This line disables all authentication checks.
  // To re-enable security, remove this line.
  return NextResponse.next();
  // END: TEMPORARY BYPASS FOR DEVELOPMENT


  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname.startsWith('/dashboard/user-management');

  const payload = sessionCookie ? await verifyToken(sessionCookie) : null;

  if (!payload) {
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

  // If user is not an admin and tries to access admin routes, redirect to dashboard
  if (isAdminRoute && payload.accessLevel !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow access to landing page even if authenticated
  if (pathname === '/') {
      return NextResponse.next();
  }

  // Allow authenticated users to proceed
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
