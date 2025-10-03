
'use client';

import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Moved auth initialization inside the handler
    const auth = getAuth(firebaseApp);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      if (error.code === 'auth/user-not-found') {
        // We don't want to reveal if a user exists, so we show the same message.
         setSubmitted(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao Enviar Email',
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <Link href="/" className="flex justify-center mb-4">
            <Logo />
          </Link>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            {submitted 
                ? "Verifique sua caixa de entrada." 
                : "Digite seu e-mail para receber um link de redefinição de senha."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
              <p className="text-muted-foreground">
                Se um conta com o e-mail <strong>{email}</strong> existir, um link para redefinição de senha foi enviado.
              </p>
               <Button asChild className="mt-6 w-full">
                <Link href="/login">Voltar para o Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
