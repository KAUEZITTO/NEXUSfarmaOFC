
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updateEmail, sendEmailVerification } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import { readData, writeData } from '@/lib/data';
import { User } from '@/lib/types';


export default function UpdateEmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'confirmPassword' | 'newEmail' | 'success'>('confirmPassword');
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuth(firebaseApp);
  const user = auth.currentUser;

  const handlePasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session?.user?.email) return;

    setIsLoading(true);
    setError(null);
    
    const credential = EmailAuthProvider.credential(session.user.email, password);
    
    try {
      await reauthenticateWithCredential(user, credential);
      setStep('newEmail');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta. Tente novamente.');
      } else {
        setError('Ocorreu um erro ao reautenticar. Tente novamente mais tarde.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session?.user?.id) return;
    
    setIsLoading(true);
    setError(null);

    try {
        await updateEmail(user, newEmail);
        
        // Update email in Vercel KV
        const users = await readData<User>('users');
        const userIndex = users.findIndex(u => u.id === session.user!.id);
        if (userIndex !== -1) {
            users[userIndex].email = newEmail;
            await writeData('users', users);
        }

        await sendEmailVerification(user);

        setStep('success');
        toast({
            title: 'Email Atualizado com Sucesso!',
            description: 'Um link de verificação foi enviado para seu novo email.',
        });

    } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
            setError('Este email já está em uso por outra conta.');
        } else if (err.code === 'auth/invalid-email') {
            setError('O formato do novo email é inválido.');
        } else {
            setError('Ocorreu um erro ao atualizar o email.');
        }
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-full max-w-md">
             <CardHeader>
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <CardTitle>Alterar Endereço de Email</CardTitle>
                </div>
                 <CardDescription>
                    {step === 'confirmPassword' && 'Para sua segurança, por favor, confirme sua senha atual.'}
                    {step === 'newEmail' && 'Digite o novo endereço de email que você deseja usar.'}
                    {step === 'success' && 'Seu email foi alterado. Verifique sua caixa de entrada.'}
                 </CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'confirmPassword' && (
                    <form onSubmit={handlePasswordConfirm} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha Atual</Label>
                            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Senha
                        </Button>
                    </form>
                )}
                 {step === 'newEmail' && (
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="newEmail">Novo Email</Label>
                            <Input id="newEmail" type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Novo Email
                        </Button>
                    </form>
                )}
                {step === 'success' && (
                    <div className="text-center space-y-4">
                        <p>Você precisará usar o novo email para fazer login da próxima vez.</p>
                        <p className="font-semibold">{newEmail}</p>
                        <Button className="w-full" onClick={() => router.push('/login')}>
                            Ok, ir para o Login
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
