
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { User } from '@/lib/types';
import { kv } from '@/lib/kv';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

async function getUserFromToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.sub;
    if (!userId) return null;

    const users = await kv.get<User[]>('users');
    return users?.find(u => u.id === userId) || null;
  } catch (e) {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminRoute = pathname.startsWith('/dashboard/user-management');

  const user = sessionCookie ? await getUserFromToken(sessionCookie) : null;

  if (!user) {
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
  if (isAdminRoute && user.accessLevel !== 'Admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow access to landing page even if authenticated
  if (pathname === '/') {
      return NextResponse.next();
  }

  const response = NextResponse.next();
  // Pass user data to the client-side via headers for easy access
  response.headers.set('x-user-data', JSON.stringify(user));
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
