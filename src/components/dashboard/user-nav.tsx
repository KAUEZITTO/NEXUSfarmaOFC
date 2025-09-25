
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
import { logout } from '@/lib/actions';
import { LogOut, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTour } from './tour-guide';
import { useCurrentUser } from '@/hooks/use-current-user';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

export function UserNav() {
  const { startTour } = useTour();
  const { toast } = useToast();
  const user = useCurrentUser();

  const handleLogout = async () => {
    try {
        await logout();
        toast({
          title: "Logout realizado",
          description: "Você saiu com segurança. Até a próxima!",
        });
        // The redirect is handled by the server action
    } catch (error) {
        // This catch block will handle the special error thrown by `redirect()`
        if (!(error as any).digest?.startsWith('NEXT_REDIRECT')) {
            console.error("Logout error:", error);
            toast({
                variant: 'destructive',
                title: "Erro ao Sair",
                description: "Não foi possível fazer logout. Tente novamente.",
            });
        }
    }
  };

  if (!user) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  return (
    <div data-tour-id="step-user-nav">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="@user" />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">{user.role}</Badge>
                {user.accessLevel === 'Admin' && <Badge variant="destructive" className="text-xs">Admin</Badge>}
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
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
