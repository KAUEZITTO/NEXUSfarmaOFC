'use client'

import React, { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';


function RegisterButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Criando conta...' : 'Criar Conta'}
    </Button>
  );
}

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      setIsPending(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Conta Criada!",
        description: "Sua conta foi criada com sucesso. Faça o login.",
      });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErrorMessage('Ocorreu um erro ao criar a conta.');
      }
    } finally {
      setIsPending(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
       <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha (mínimo 6 caracteres)</Label>
        <Input id="password" name="password" type="password" required placeholder="••••••••" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="confirm-password">Confirmar Senha</Label>
        <Input id="confirm-password" name="confirm-password" type="password" required placeholder="••••••••" />
      </div>
      <RegisterButton isPending={isPending} />

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Cadastro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
