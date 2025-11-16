

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const avatarColors = [
  'hsl(211 100% 50%)', // Blue
  'hsl(39 100% 50%)', // Orange
  'hsl(0 84.2% 60.2%)', // Red
  'hsl(142.1 76.2% 36.3%)', // Green
  'hsl(262.1 83.3% 57.8%)', // Purple
  'hsl(314.5 72.4% 57.3%)', // Pink
  'hsl(198.8 93.4% 42%)' // Teal
];

export function AccountForm() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [avatarColor, setAvatarColor] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if(user) {
        setName(user.name || '');
        setBirthdate(user.birthdate ? user.birthdate.split('T')[0] : '');
        setAvatarColor(user.avatarColor || avatarColors[0]);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const result = await updateUserProfile(user.id, { name, birthdate, avatarColor });
      
      // Manually update the session on the client-side
      await updateSession({ 
        ...session, 
        user: { 
          ...session?.user, 
          name: result.user.name, 
          birthdate: result.user.birthdate,
          avatarColor: result.user.avatarColor 
        } 
      });

      toast({
        title: 'Perfil Atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      
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
            <AvatarFallback 
                className="text-3xl text-white font-bold"
                style={{ backgroundColor: avatarColor }}
            >
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
           <div className="text-center sm:text-left">
              <h4 className="text-lg font-semibold">Avatar do Perfil</h4>
              <p className="text-sm text-muted-foreground">O avatar é gerado automaticamente a partir da inicial do seu nome. Escolha sua cor de fundo preferida abaixo.</p>
           </div>
        </div>

        <div>
            <Label>Cor do Avatar</Label>
            <div className="flex flex-wrap gap-2 mt-2">
                {avatarColors.map(color => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setAvatarColor(color)}
                        className={cn('h-8 w-8 rounded-full border-2 transition-all', avatarColor === color ? 'border-ring' : 'border-transparent')}
                        style={{ backgroundColor: color }}
                    >
                        {avatarColor === color && <Check className="h-5 w-5 text-white" />}
                    </button>
                ))}
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
