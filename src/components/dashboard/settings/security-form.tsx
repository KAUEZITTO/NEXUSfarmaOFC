
'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase/client';
import Link from 'next/link';
import type { User } from '@/lib/types';

export function SecurityForm({ user }: { user: User | undefined }) {
  const { toast } = useToast();

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Email do usuário não encontrado para redefinir a senha.',
      });
      return;
    }
    const auth = getAuth(firebaseApp);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Email de Redefinição Enviado!',
        description: 'Verifique sua caixa de entrada para criar uma nova senha.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Enviar Email',
        description: 'Não foi possível enviar o email de redefinição. Tente novamente.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <h4 className="font-medium">Alterar Senha</h4>
          <p className="text-sm text-muted-foreground">
            Um link para redefinição será enviado para seu email.
          </p>
        </div>
        <Button variant="outline" onClick={handleChangePassword}>
          Enviar Link
        </Button>
      </div>
       <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <h4 className="font-medium">Alterar Email</h4>
          <p className="text-sm text-muted-foreground">
            Você será redirecionado para confirmar sua senha e definir um novo email.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings/update-email">
            Alterar Email
          </Link>
        </Button>
      </div>
    </div>
  );
}
