
'use client';

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
import { Save, User, Lock } from "lucide-react";

export default function SettingsPage() {

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would dispatch a server action here to change the password
        alert("Funcionalidade de alteração de senha não implementada neste protótipo.");
    }

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
         // In a real app, you would dispatch a server action here to update the profile
        alert("Funcionalidade de atualização de perfil não implementada neste protótipo.");
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
              <Input id="current-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input id="confirm-password" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Alterar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
