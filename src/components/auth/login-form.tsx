
'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import { login } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { LoadingCapsule } from '../ui/loading-capsule';

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await login(formData);
       if (result && !result.success) {
           setErrorMessage(result.message);
       }
    } catch (error: any) {
        // This will catch errors thrown from the server action,
        // including the redirect error which we can safely ignore.
        if (error.digest?.startsWith('NEXT_REDIRECT')) {
            // This is expected, do nothing. The redirect will happen.
        } else {
            console.error(error);
            setErrorMessage(error.message || 'Ocorreu um erro inesperado.');
        }
    } finally {
        setIsPending(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          required
        />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="password">Senha</Label>
        </div>
        <Input 
          id="password" 
          name="password"
          type="password" 
          required 
          placeholder="••••••••"
        />
      </div>
       <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <LoadingCapsule />}
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Login</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
