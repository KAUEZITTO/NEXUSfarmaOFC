
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';

export const dynamic = 'force-dynamic';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError('Link inválido ou expirado. Por favor, solicite a redefinição novamente.');
      setIsLoading(false);
      return;
    }
    
    setOobCode(code);
    
    const auth = getAuth(firebaseApp);
    // Verify the code to make sure it's valid before showing the form
    verifyPasswordResetCode(auth, code)
      .then(() => {
        setIsLoading(false);
      })
      .catch(() => {
        setError('Link inválido ou expirado. Por favor, solicite a redefinição novamente.');
        setIsLoading(false);
      });
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    if (!oobCode) return;

    setIsSubmitting(true);
    const auth = getAuth(firebaseApp);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      toast({
        title: 'Senha Redefinida!',
        description: 'Sua senha foi alterada com sucesso. Você pode fazer login agora.',
      });
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      console.error('Password reset confirmation error:', error);
      setError('Ocorreu um erro ao redefinir a senha. O link pode ter expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Link href="/" className="flex justify-center mb-4">
                <Logo />
            </Link>
            <CardTitle className="text-2xl">Definir Nova Senha</CardTitle>
            <CardDescription>
                {success ? "Sua senha foi alterada com sucesso!" : "Crie uma nova senha para sua conta."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error && !success ? (
                <div className="text-center text-destructive">
                    <ShieldAlert className="mx-auto h-12 w-12 mb-4" />
                    <p>{error}</p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/forgot-password">Solicitar Novo Link</Link>
                    </Button>
                </div>
            ) : success ? (
                 <div className="text-center text-green-600">
                    <ShieldCheck className="mx-auto h-12 w-12 mb-4" />
                    <p>Você será redirecionado para a página de login em alguns segundos...</p>
                    <Button asChild className="mt-6 w-full">
                        <Link href="/login">Ir para Login</Link>
                    </Button>
                </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Nova Senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
  )
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <ResetPasswordForm />
        </Suspense>
    )
}
