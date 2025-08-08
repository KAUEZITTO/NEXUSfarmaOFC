'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// authenticate function is no longer needed here as it will be handled client-side with Firebase.

export async function createSessionCookie(token: string) {
    cookies().set('session', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
    redirect('/dashboard');
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
