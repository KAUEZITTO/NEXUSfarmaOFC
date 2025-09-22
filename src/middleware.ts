

'use server';

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

  // To avoid fetching user data here, we will handle it on the client side using an API route
  // or a client component that fetches user data based on the cookie.
  // We can pass a header to indicate the user is logged in, if needed, but not the full user object.
  const response = NextResponse.next();
  // We no longer pass the full user object to avoid KV calls in middleware.
  // The client will fetch user data via an API route.
  
  // A better approach is to fetch user data in a client component layout
  // This avoids passing sensitive data in headers and removes KV calls from middleware
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
    

    