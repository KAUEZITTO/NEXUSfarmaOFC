
'use client';

import { Logo } from '@/components/logo';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="mx-auto w-full max-w-sm rounded-lg border bg-background p-8 shadow-sm">
        <div className="grid gap-2 text-center">
          <Link href="/" className="flex justify-center">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold mt-4">Login</h1>
          <p className="text-balance text-muted-foreground">
            Acesse sua conta para gerenciar o sistema
          </p>
        </div>
        
        <LoginForm />
        
        <div className="mt-4 text-center text-sm">
          <Link href="/forgot-password"
            className="text-sm underline"
          >
            Esqueceu a senha?
          </Link>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => signIn('google')}>
           <Image src="/google.svg" alt="Google icon" width={20} height={20} className="mr-2" />
           Google
        </Button>
        
        <div className="mt-4 text-center text-sm">
          Não tem uma conta?{' '}
          <Link href="/register" className="underline">
            Cadastre-se
          </Link>
        </div>
      </div>
    </div>
  );
}
