
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readData } from '@/lib/data';
import type { User } from '@/lib/types';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-development');

const TEST_USER_EMAIL = 'teste@nexus.com';
const TEST_USER_PASSWORD = 'nexus123';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios.' }, { status: 400 });
    }

    let user: Omit<User, 'password'> & { password?: string } | null = null;
    let passwordMatch = false;

    // --- Test User Logic ---
    if (email === TEST_USER_EMAIL) {
      if (password === TEST_USER_PASSWORD) {
        user = {
          id: 'user-test',
          email: TEST_USER_EMAIL,
          role: 'Farmacêutico',
          subRole: 'CAF',
          accessLevel: 'Admin'
        };
        passwordMatch = true;
      }
    } else {
      // --- Standard User Logic ---
      const users = await readData<User>('users');
      const foundUser = users.find(u => u.email === email);

      if (foundUser) {
        // Ensure foundUser.password is not undefined before comparing
        if (foundUser.password) {
            const isMatch = await bcrypt.compare(password, foundUser.password);
            if (isMatch) {
              user = foundUser;
              passwordMatch = true;
            }
        }
      }
    }
    
    if (!user || !passwordMatch) {
        return NextResponse.json({ success: false, message: 'Email ou senha inválidos.' }, { status: 401 });
    }

    if (!user.accessLevel) {
       console.error(`[API LOGIN ERROR] User ${user.email} has no accessLevel defined.`);
       return NextResponse.json({ success: false, message: 'Erro de configuração de conta. Contate o suporte.' }, { status: 500 });
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
