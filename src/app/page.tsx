import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex justify-center">
              <Logo />
            </div>
            <h1 className="text-3xl font-bold mt-4">Login</h1>
            <p className="text-balance text-muted-foreground">
              Insira seu e-mail e senha para acessar o painel
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
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1920x1080.png"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="warehouse medical supplies"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
