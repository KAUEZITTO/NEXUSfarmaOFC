'use client'

import { useFormStatus } from 'react-dom';
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function RegisterButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? 'Criando conta...' : 'Criar Conta'}
    </Button>
  );
}

export function RegisterForm() {
  // In a real app, this would use useFormState and a server action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Funcionalidade de registro não implementada neste protótipo.");
  }
  
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" name="name" placeholder="Seu Nome" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="userId">ID de Usuário (6 dígitos)</Label>
        <Input 
          id="userId" 
          name="userId" 
          placeholder="Ex: 654321" 
          required 
          maxLength={6}
          pattern="\d{6}"
          title="ID de usuário deve conter 6 dígitos."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" required placeholder="••••••••" />
      </div>
      <RegisterButton />
    </form>
  )
}
