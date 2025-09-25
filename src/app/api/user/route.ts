import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { readData } from '@/lib/data';
import type { User } from '@/lib/types';

export const dynamic = 'force-dynamic';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

// The logic to get the user is now self-contained in the API route
// to avoid build-time static analysis issues.
async function getCurrentUserFromDb(userId: string): Promise<User | null> {
    if (!userId) return null;
    const users = await readData<User>('users');
    const user = users.find(u => u.id === userId) || null;
    if (user) {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
    return null;
}

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

    // This function is now local to the API route.
    const user = await getCurrentUserFromDb(userId);

    if (user) {
      // The password is already removed by getCurrentUserFromDb
      return NextResponse.json(user);
    }

    return new NextResponse('User not found', { status: 404 });
  } catch (error) {
      console.error("API route /api/user error:", error);
      return new NextResponse('Internal Server Error', { status: 500 });
  }
}
