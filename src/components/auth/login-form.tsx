
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await login(formData);
      // If the login action returns an error message, display it.
      if (result?.message) {
        setErrorMessage(result.message);
        setIsPending(false);
      }
      // If login is successful, the server action will redirect, and this component
      // will unmount. If it's still mounted and there's no error, something is wrong.
    } catch (error: any) {
        // The `redirect()` function throws a special NEXT_REDIRECT error.
        // We should not treat it as an actual error in the form.
        // Any other error, however, should be displayed.
        if (error.digest?.startsWith('NEXT_REDIRECT')) {
           // This is expected, do nothing. The browser will be redirected.
        } else {
            console.error("An unexpected error occurred during login:", error);
            setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
            setIsPending(false);
        }
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
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
