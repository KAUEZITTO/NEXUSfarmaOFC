
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
      if (authError === 'CredentialsSignin') {
        setError('Credenciais inválidas. Verifique seu email e senha.');
      } else {
        setError('Ocorreu um erro durante o login. Tente novamente.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    // Let NextAuth handle the redirect. It will redirect to the page the user
    // was trying to access, or the home page by default.
    // If there's an error, NextAuth will reload the page with an error query param.
    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/dashboard', // Explicitly define the success URL
    });

    // We don't need to set isLoading to false here because a successful login
    // will navigate away from the page. An unsuccessful login will reload
    // the page, resetting the state.
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@exemplo.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
            <Input 
              id="password" 
              name="password"
              type={showPassword ? "text" : "password"} 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pr-10"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Login</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
      </Button>
    </form>
  );
}
