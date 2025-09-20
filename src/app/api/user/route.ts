
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headersList = headers();
  const userData = headersList.get('x-user-data');

  if (userData) {
    try {
      const user = JSON.parse(userData);
      return NextResponse.json(user);
    } catch (error) {
      return new NextResponse('Error parsing user data', { status: 500 });
    }
  }

  return new NextResponse('User data not found', { status: 404 });
}
