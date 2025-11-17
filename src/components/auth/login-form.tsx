
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
      // Mapeia erros conhecidos do NextAuth para mensagens amigáveis
      switch (authError) {
        case 'Configuration':
          setError('Ocorreu um erro de configuração no servidor. Por favor, contate o suporte.');
          break;
        case 'CredentialsSignin':
           setError('Email ou senha inválidos. Verifique suas credenciais e tente novamente.');
           break;
        default:
          setError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
          break;
      }
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!firebaseApp) {
      setError("O serviço de autenticação não está disponível. Contate o suporte.");
      setIsLoading(false);
      return;
    }
    const auth = getAuth(firebaseApp);

    try {
      // Passo 1: Autenticar com o Firebase no cliente
      await signInWithEmailAndPassword(auth, email, password);

      // Passo 2: Se a autenticação do Firebase foi bem-sucedida, criar a sessão no NextAuth
      const result = await signIn('credentials', {
        email: email,
        redirect: false, // Gerenciamos o redirecionamento manualmente
      });

      if (result?.error) {
        // Se o signIn do NextAuth falhar (ex: usuário não encontrado no nosso DB pelo callback 'jwt')
        setError(result.error === 'CredentialsSignin' ? 'Usuário não encontrado no sistema NexusFarma.' : 'Não foi possível iniciar a sessão. Verifique suas credenciais.');
        setIsLoading(false);
      } else if (result?.ok) {
        // Sucesso! Forçar recarregamento completo para garantir que o estado da sessão seja limpo.
        window.location.href = '/dashboard';
      }

    } catch (firebaseError: any) {
      // Erro na autenticação com o Firebase
      console.error("Firebase signIn error:", firebaseError.code);
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos. Verifique suas credenciais e tente novamente.');
      } else {
        setError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
      }
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
