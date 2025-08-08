
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, User, Lock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SettingsPage() {
    const { toast } = useToast();
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    
    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSavingPassword(true);

        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get('current-password') as string;
        const newPassword = formData.get('new-password') as string;
        const confirmPassword = formData.get('confirm-password') as string;
        
        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Erro', description: 'As novas senhas não coincidem.' });
            setIsSavingPassword(false);
            return;
        }

        const user = auth.currentUser;
        if (!user || !user.email) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não encontrado. Por favor, faça login novamente.' });
            setIsSavingPassword(false);
            return;
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);

        try {
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast({ title: 'Sucesso!', description: 'Sua senha foi alterada com sucesso.' });
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            console.error("Password change error:", error.code);
            if (error.code === 'auth/wrong-password') {
                toast({ variant: 'destructive', title: 'Erro', description: 'A senha atual está incorreta.' });
            } else if (error.code === 'auth/weak-password') {
                toast({ variant: 'destructive', title: 'Erro', description: 'A nova senha deve ter pelo menos 6 caracteres.' });
            } else {
                 toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao alterar a senha.' });
            }
        } finally {
            setIsSavingPassword(false);
        }
    }

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
         // In a real app, you would dispatch a server action here to update the profile
        toast({
            title: 'Funcionalidade em Desenvolvimento',
            description: 'A atualização do perfil ainda não foi implementada neste protótipo.',
        });
    }

  return (
    <div className="grid gap-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil
          </CardTitle>
          <CardDescription>
            Atualize as informações da sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" defaultValue="Usuário de Teste" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId">ID de Usuário</Label>
              <Input id="userId" defaultValue="KAUE23" readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="kaue23@example.com" />
            </div>
             <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Escolha uma nova senha forte para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" name="current-password" type="password" placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" name="new-password" type="password" placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isSavingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
