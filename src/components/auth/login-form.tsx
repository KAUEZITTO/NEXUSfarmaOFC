
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';

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
      } else if (authError === 'Configuration') {
        setError('Ocorreu um erro de configuração de autenticação. Contate o suporte.');
      }
      else {
        setError('Ocorreu um erro de autenticação. Tente novamente.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Firebase on the client
      const auth = getAuth(firebaseApp);
      await signInWithEmailAndPassword(auth, email, password);
      
      // 2. If Firebase auth is successful, sign in with NextAuth using credentials
      const result = await signIn('credentials', {
        email,
        password, // Password is sent but not re-validated, just for the provider's signature
        redirect: false,
      });
      
      if (result?.error) {
        console.error("NextAuth signIn error:", result.error);
        if (result.error === 'CredentialsSignin') {
           setError('Credenciais inválidas ou usuário não encontrado no sistema.');
        } else {
           setError(`Ocorreu um erro ao criar sua sessão. Tente novamente.`);
        }
      } else if (result?.ok) {
        // On successful NextAuth sign-in, redirect to the dashboard
        router.push('/dashboard');
        router.refresh(); // Ensure the layout re-renders with session data
      }

    } catch (firebaseError: any) {
      // Handle Firebase-specific errors
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else {
        console.error("Firebase login error:", firebaseError);
        setError('Ocorreu um erro ao tentar fazer login. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 mt-6">
      <fieldset disabled={isLoading} className="grid gap-4">
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

        <Button type="submit" className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Entrar'}
        </Button>
      </fieldset>
    </form>
  );
}
