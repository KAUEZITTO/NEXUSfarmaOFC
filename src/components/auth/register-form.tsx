
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

const allRoles: Role[] = ['Farmacêutico', 'Enfermeiro(a)', 'Técnico de Enfermagem', 'Auxiliar de Farmácia', 'Atendente de Farmácia', 'Digitador', 'Coordenador'];
const pharmacistSubRoles: SubRole[] = ['CAF', 'Hospitalar', 'Coordenador'];


interface RegisterFormProps {
    registerAction: (data: { name: string, email: string; password: string; birthdate: string; role: Role; subRole?: SubRole; location?: UserLocation }) => Promise<{ success: boolean; message: string; }>;
}

export function RegisterForm({ registerAction }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<UserLocation | ''>('');
  const [selectedRole, setSelectedRole] = useState<Role | ''>('');
  const [selectedSubRole, setSelectedSubRole] = useState<SubRole | ''>('');
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    const birthdate = formData.get('birthdate') as string;
    const role = formData.get('role') as Role;
    const subRole = formData.get('subRole') as SubRole | undefined;
    const location = formData.get('location') as UserLocation | undefined;

    if (!birthdate) {
        setErrorMessage("A data de nascimento é obrigatória.");
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

    // Lógica de validação corrigida para resolver o erro de tipo
    if (role === 'Farmacêutico' && !subRole) {
        setErrorMessage("Para farmacêuticos, a área de atuação é obrigatória.");
        setIsPending(false);
        return;
    }
    
    // Se não for farmacêutico ou for farmacêutico que não é coordenador, o local é obrigatório.
    if ( (role !== 'Farmacêutico' || (role === 'Farmacêutico' && subRole !== 'Coordenador') ) && !location) {
        setErrorMessage("Por favor, selecione um local (CAF ou Hospital) para este cargo/atuação.");
        setIsPending(false);
        return;
    }

    try {
      const result = await registerAction({ name, email, password, birthdate, role, subRole, location });
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

  const handleRoleChange = (value: string) => {
    const newRole = value as Role;
    setSelectedRole(newRole);
    // Reset selections dependent on role
    setSelectedSubRole('');
    if (newRole !== 'Farmacêutico') {
        // Se o novo cargo não for Farmacêutico, a sub-área não se aplica.
    }
  }

  const showSubRole = selectedRole === 'Farmacêutico';
  const showLocation = selectedRole && (selectedRole !== 'Farmacêutico' || (selectedRole === 'Farmacêutico' && selectedSubRole !== 'Coordenador'));

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
        <Label htmlFor="birthdate">Data de Nascimento</Label>
        <Input id="birthdate" name="birthdate" type="date" required />
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
            <Label htmlFor="role">Cargo</Label>
            <Select name="role" required value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger><SelectValue placeholder="Selecione seu cargo" /></SelectTrigger>
                <SelectContent>
                    {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>

        {showSubRole && (
            <div className="grid gap-2">
                <Label htmlFor="subRole">Área de Atuação (Farmacêutico)</Label>
                <Select name="subRole" required={showSubRole} value={selectedSubRole} onValueChange={(v) => setSelectedSubRole(v as SubRole)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                    <SelectContent>
                        {pharmacistSubRoles.map(sr => <SelectItem key={sr} value={sr}>{sr}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        )}

        {showLocation && (
            <div className="grid gap-2">
                <Label htmlFor="location">Local de Trabalho</Label>
                <Select name="location" required={showLocation} value={selectedLocation} onValueChange={(v) => setSelectedLocation(v as UserLocation)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o local..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CAF">CAF (Gestão Central)</SelectItem>
                        <SelectItem value="Hospital">Hospital</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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
