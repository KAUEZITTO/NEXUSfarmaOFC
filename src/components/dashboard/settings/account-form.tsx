
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export function AccountForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if(user) {
        setName(user.name || '');
        setBirthdate(user.birthdate ? user.birthdate.split('T')[0] : '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      // Pass only name and birthdate, image is no longer managed here.
      const result = await updateUserProfile(user.id, { name, birthdate });
      
      await updateSession({ ...session, user: { ...session?.user, ...result.user } });

      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      
      router.refresh();

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar suas informações.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const fallbackInitial = user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-20 w-20">
            {/* The AvatarImage is removed as we no longer use profile pictures */}
            <AvatarFallback className="text-3xl">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
           <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold">Avatar do Perfil</h4>
              <p className="text-sm text-muted-foreground">O avatar é gerado automaticamente a partir da inicial do seu nome.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome de Exibição</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
                <Label htmlFor="birthdate">Data de Nascimento</Label>
                <Input id="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
            </div>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </>
  );
}
