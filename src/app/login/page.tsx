
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="mx-auto grid w-[380px] gap-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="grid gap-2 text-center">
          <Link href="/" className="flex justify-center">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold mt-4">Login</h1>
          <p className="text-balance text-muted-foreground">
            Insira suas credenciais para acessar o sistema
          </p>
        </div>
        <LoginForm />
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
