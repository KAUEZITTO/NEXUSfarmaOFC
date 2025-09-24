
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { getCurrentUser } from '@/lib/data';

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

    // This now calls the clean, build-safe function from data.ts
    const user = await getCurrentUser(userId);

    if (user) {
      // The password is already removed by the new getCurrentUser function
      return NextResponse.json(user);
    }

    return new NextResponse('User not found', { status: 404 });
  } catch (error) {
      console.error("API route /api/user error:", error);
      return new NextResponse('Internal Server Error', { status: 500 });
  }
}

    