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
            <Link href="/" className="flex justify-center">
              <Logo />
            </Link>
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
          src="/login-background.png"
          alt="Imagem de fundo do login"
          width="1920"
          height="1080"
          data-ai-hint="pharmacy pill leaves"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
