
import { Separator } from "@/components/ui/separator"
import { AccountForm } from "@/components/dashboard/settings/account-form"
import { AppearanceForm } from "@/components/dashboard/settings/appearance-form"
import { SecurityForm } from "@/components/dashboard/settings/security-form"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Conta</h3>
        <p className="text-sm text-muted-foreground">
          Atualize as configurações da sua conta. Defina seu nome e informações pessoais.
        </p>
      </div>
      <Separator />
      <AccountForm />

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Segurança</h3>
        <p className="text-sm text-muted-foreground">
          Altere sua senha e email.
        </p>
      </div>
      <Separator />
      <SecurityForm />

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
