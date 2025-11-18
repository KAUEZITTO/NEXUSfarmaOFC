
import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/logo';
import { register } from '@/lib/actions/admin';


export default function RegisterPage() {
  
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
       <div className="hidden bg-muted lg:block">
        <Image
          src="/placeholder.png"
          alt="Image"
          width="1920"
          height="1080"
          data-ai-hint="medical inventory shelf"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
             <Link href="/" className="flex justify-center">
              <Logo />
            </Link>
            <h1 className="text-3xl font-bold mt-4">Criar Conta</h1>
            <p className="text-balance text-muted-foreground">
              Preencha o formulário para criar sua conta. A primeira conta criada será a do Administrador.
            </p>
          </div>
          <RegisterForm registerAction={register} />
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/login" className="underline">
              Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

    