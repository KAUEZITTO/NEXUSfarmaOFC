
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { getCurrentUser } from '@/lib/data';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

export async function GET(request: Request) {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { payload } = await jose.jwtVerify(sessionCookie, secret);
    const userId = payload.sub;
    if (!userId) {
        return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await getCurrentUser(userId);

    if (user) {
      // We don't want to expose the password hash
      const { password, ...userData } = user;
      return NextResponse.json(userData);
    }

    return new NextResponse('User not found', { status: 404 });
  } catch (error) {
      console.error("API route /api/user error:", error);
      return new NextResponse('Internal Server Error', { status: 500 });
  }
}
