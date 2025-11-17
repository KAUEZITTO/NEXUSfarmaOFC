
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    const debugInfo = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
      NEXTAUTH_SECRET_EXISTS: process.env.NEXTAUTH_SECRET ? 'OK' : 'MISSING',
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
      FIREBASE_PRIVATE_KEY_EXISTS: privateKey ? 'OK' : 'MISSING',
      FIREBASE_PRIVATE_KEY_SAMPLE: privateKey.substring(0, 40) + '...',
      FIREBASE_PRIVATE_KEY_HAS_NEWLINES: privateKey.includes('\\n'),
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve debug info', details: (error as Error).message },
      { status: 500 }
    );
  }
}
