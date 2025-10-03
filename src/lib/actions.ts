
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jose from 'jose';
import bcrypt from 'bcrypt';

// --- FAKE USER DATABASE ---
// Em um app real, isso viria de um banco de dados como Vercel KV, Supabase, etc.
const fakeUser = {
  id: 'user_1',
  email: 'admin@exemplo.com',
  // Hash para a senha "123456"
  passwordHash: '$2b$10$fVixcCFGqlp9.g7ZMvT9n.itu7Xv/Y.lBv3/aFGHY5z/Gqf3I2Lve',
};

// --- AUTH ACTIONS ---

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios.' };
  }

  // Validar credenciais contra o banco fake
  if (email !== fakeUser.email) {
    return { error: 'Credenciais inválidas.' };
  }

  const passwordMatch = await bcrypt.compare(password, fakeUser.passwordHash);
  if (!passwordMatch) {
    return { error: 'Credenciais inválidas.' };
  }
  
  try {
    // Se as credenciais estiverem corretas, gerar o JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const alg = 'HS256';

    const token = await new jose.SignJWT({ id: fakeUser.id, email: fakeUser.email })
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setExpirationTime('1h') // Token expira em 1 hora
      .setSubject(fakeUser.id) // Subject (sub) claim
      .sign(secret);
    
    // Salvar o token no cookie httpOnly
    cookies().set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hora
      path: '/',
      sameSite: 'strict',
    });

    // O redirect deve estar DENTRO do bloco try para funcionar corretamente
    redirect('/dashboard');

  } catch (error) {
    if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('Falha ao autenticar:', error);
    return { error: 'Ocorreu um erro inesperado durante o login.' };
  }
}

export async function logout() {
  // Simplesmente deleta o cookie da sessão
  cookies().set('session', '', { expires: new Date(0) });
  redirect('/login');
}


export async function getCurrentUser() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jose.jwtVerify(sessionCookie, secret);
        
        // Retorna o conteúdo do token
        return {
            id: payload.id as string,
            email: payload.email as string,
        };

    } catch (error) {
        // Se o token for inválido ou expirado, retorna null
        console.warn("Sessão inválida:", error);
        return null;
    }
}
