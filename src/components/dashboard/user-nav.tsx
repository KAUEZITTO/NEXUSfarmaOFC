
'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, HelpCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTour } from './tour-guide';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';

/**
* Hook personalizado para acessar a sessão. 
* Em um projeto maior, isso pode ser movido para seu próprio arquivo (ex: src/hooks/use-auth.ts)
* Por simplicidade, usamos o `useSession` diretamente no componente.
*/
// export const useAuth = () => {
//   const session = useSession();
//   return {
//     user: session.data?.user,
//     status: session.status,
//   };
// };


export function UserNav() {
  const { startTour } = useTour();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
    toast({
      title: "Logout realizado",
      description: "Você saiu com segurança. Até a próxima!",
    });
  };

  if (status === 'loading') {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  const user = session?.user;
  if (!user) return null;

  const fallbackInitial = user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div data-tour-id="step-user-nav">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || ''} alt={user.name || user.email || 'Avatar'} />
              <AvatarFallback>
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none truncate">{user.name || user.email}</p>
               <p className="text-xs leading-none text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
             <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={startTour}>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Fazer Tour</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
