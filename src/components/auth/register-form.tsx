'use client'

import React, { useState } from 'react';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Role, SubRole, UserLocation } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


function RegisterButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Criando conta...' : 'Criar Conta'}
    </Button>
  );
}

const cafRoles: Role[] = ['Farmacêutico', 'Coordenador', 'Técnico de Enfermagem', 'Auxiliar de Farmácia', 'Digitador'];
const hospitalRoles: Role[] = ['Farmacêutico', 'Enfermeiro(a)', 'Técnico de Enfermagem', 'Atendente de Farmácia'];
const pharmacistSubRoles: SubRole[] = ['CAF', 'Hospitalar', 'Coordenador'];


interface RegisterFormProps {
    registerAction: (data: { name: string, email: string; password: string; role: Role; subRole?: SubRole; location: UserLocation }) => Promise<{ success: boolean; message: string; }>;
}

export function RegisterForm({ registerAction }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | ''>('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');

  const availableRoles = selectedLocation === 'CAF' ? cafRoles : selectedLocation === 'Hospital' ? hospitalRoles : [];
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    const location = formData.get('location') as UserLocation;
    const role = formData.get('role') as Role;
    const subRole = formData.get('subRole') as SubRole | undefined;

    if (!location) {
        setErrorMessage("Por favor, selecione um local (CAF ou Hospital).");
        setIsPending(false);
        return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      setIsPending(false);
      return;
    }
    
    if (password.length < 6) {
        setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
        setIsPending(false);
        return;
    }

    if (!role) {
        setErrorMessage("Por favor, selecione um cargo.");
        setIsPending(false);
        return;
    }

    try {
      const result = await registerAction({ name, email, password, role, subRole, location });
      if (result.success) {
        toast({
            title: "Conta Criada com Sucesso!",
            description: "Você será redirecionado para a tela de login.",
        });
        router.push('/login');
      } else {
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setIsPending(false);
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
       <div className="grid gap-2">
        <Label htmlFor="name">Nome de Exibição</Label>
        <Input id="name" name="name" type="text" placeholder="Seu nome completo" required />
      </div>
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

       <div className="grid gap-2">
          <Label htmlFor="location">Local de Trabalho</Label>
          <Select name="location" required onValueChange={(v) => { setSelectedLocation(v as UserLocation); setSelectedRole(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o local..." /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="CAF">CAF (Gestão Central)</SelectItem>
                  <SelectItem value="Hospital">Hospital</SelectItem>
              </SelectContent>
          </Select>
      </div>

      {selectedLocation && (
        <>
            <div className="grid gap-2">
                <Label htmlFor="role">Cargo</Label>
                <Select name="role" required value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                    <SelectTrigger><SelectValue placeholder="Selecione seu cargo" /></SelectTrigger>
                    <SelectContent>
                        {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            {selectedRole === 'Farmacêutico' && (
               <div className="grid gap-2">
                  <Label htmlFor="subRole">Área de Atuação</Label>
                  <Select name="subRole" required>
                      <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                      <SelectContent>
                          {pharmacistSubRoles.map(sr => <SelectItem key={sr} value={sr}>{sr}</SelectItem>)}
                      </SelectContent>
                  </Select>
               </div>
            )}
        </>
      )}


      <RegisterButton isPending={isPending} />

      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Cadastro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
