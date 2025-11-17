
'use server';

import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import type { User } from './types';

const secretKey = process.env.NEXTAUTH_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function verifyAuth(req?: NextRequest) {
    const token = req ? req.cookies.get('session_token')?.value : cookies().get('session_token')?.value;

    if (!token) {
        throw new Error('Token de sessão não encontrado.');
    }

    try {
        const verified = await decrypt(token);
        return verified as User;
    } catch (err) {
        throw new Error('Seu token de sessão expirou ou é inválido.');
    }
}
