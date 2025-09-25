
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readData } from '@/lib/data';
import type { User } from '@/lib/types';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    const users = await readData<User>('users');
    const user = users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Email ou senha inválidos.' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ success: false, message: 'Email ou senha inválidos.' }, { status: 401 });
    }

    const token = await new jose.SignJWT({ id: user.id, accessLevel: user.accessLevel })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(user.id)
      .setIssuer('urn:nexusfarma')
      .setAudience('urn:nexusfarma:users')
      .setExpirationTime('7d')
      .sign(secret);
      
    cookies().set('session', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 });
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[API LOGIN ERROR]', error);
    return NextResponse.json({ success: false, message: 'Ocorreu um erro inesperado no servidor.' }, { status: 500 });
  }
}

    