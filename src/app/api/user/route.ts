
import { getCurrentUser } from '@/lib/data';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (user) {
    // We don't want to expose the password hash
    const { password, ...userData } = user;
    return NextResponse.json(userData);
  }

  return new NextResponse('User not found', { status: 404 });
}

    