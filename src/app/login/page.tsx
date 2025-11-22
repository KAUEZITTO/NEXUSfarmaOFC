'use client';

import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

function LoginFormSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="mx-auto w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm">
        <div className="grid gap-2 text-center">
          <Link href="/" className="flex justify-center">
            <Logo className="w-56 h-20" />
          </Link>
          <h1 className="text-3xl font-bold mt-4">Login</h1>
          <p className="text-balance text-muted-foreground">
            Acesse sua conta para gerenciar o sistema
          </p>
        </div>
        
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
        
        <div className="mt-4 text-center text-sm">
          <Link href="/forgot-password"
            className="text-sm underline"
          >
            Esqueceu a senha?
          </Link>
        </div>
        
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
