'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const userId = formData.get('userId') as string;
    const password = formData.get('password') as string;

    // Mock authentication logic
    // In a real app, you would validate against a database
    if (userId === '123456' && password === 'password') {
      cookies().set('session', 'true', { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 });
    } else {
      return 'ID de usuário ou senha inválidos.';
    }
  } catch (error) {
    if ((error as Error).message.includes('credentialssignin')) {
      return 'ID de usuário ou senha inválidos.';
    }
    return 'Ocorreu um erro. Tente novamente.';
  }

  redirect('/dashboard');
}

export async function logout() {
  cookies().delete('session');
  redirect('/');
}
