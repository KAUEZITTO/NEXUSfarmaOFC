
'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    
    try {
        const result = await login(formData);

        // This code will only execute if the server action returns an error
        if (result && !result.success) {
          setErrorMessage(result.message);
          setIsPending(false);
        } else {
            // The server action will handle the redirect on success.
            // If we get here without an error, it means the redirect is happening.
            toast({
                title: 'Login bem-sucedido!',
                description: 'Bem-vindo(a) de volta! Redirecionando...',
            });
        }
    } catch (error) {
        // This catch block will handle the special error thrown by `redirect()`
        // in Next.js. We can safely ignore it. Any other real errors will
        // be caught and can be handled here if needed.
        if ((error as any).digest?.startsWith('NEXT_REDIRECT')) {
            // This is expected, do nothing.
        } else {
            console.error("Login form error:", error);
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
