
'use server'; // Convertido para Server Component

import { Separator } from "@/components/ui/separator";
import { AccountForm } from "@/components/dashboard/settings/account-form";
import { AppearanceForm } from "@/components/dashboard/settings/appearance-form";
import { SecurityForm } from "@/components/dashboard/settings/security-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { getCurrentUser } from "@/lib/auth"; // Importação direta da função de servidor

export default async function SettingsPage() {
  const user = await getCurrentUser();
  
  // Show alert if the user exists but doesn't have a name set yet
  const showUpdateProfileReminder = user && !user.name;

  return (
    <div className="space-y-6">
      {showUpdateProfileReminder && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Complete seu Perfil</AlertTitle>
          <AlertDescription>
            Parece que seu nome de exibição não está definido. Por favor, atualize suas informações abaixo para uma melhor experiência.
          </AlertDescription>
        </Alert>
      )}

      <div>
        <h3 className="text-lg font-medium">Conta</h3>
        <p className="text-sm text-muted-foreground">
          Atualize as configurações da sua conta. Defina seu nome e informações pessoais.
        </p>
      </div>
      <Separator />
      {/* Passamos o usuário como prop para o formulário cliente */}
      <AccountForm user={user} />

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Segurança</h3>
        <p className="text-sm text-muted-foreground">
          Altere sua senha e email.
        </p>
      </div>
      <Separator />
       {/* Passamos o usuário como prop para o formulário cliente */}
      <SecurityForm user={user} />

      <Separator />
      
      <div>
        <h3 className="text-lg font-medium">Aparência</h3>
        <p className="text-sm text-muted-foreground">
          Customize a aparência do sistema. Alterne entre modo claro e escuro.
        </p>
      </div>
      <Separator />
      <AppearanceForm />
    </div>
  )
}
