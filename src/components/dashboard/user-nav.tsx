
'use client';

import {
  Avatar,
  AvatarFallback,
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
import { LogOut, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useSession } from 'next-auth/react';
import { signOut } from '@/lib/auth';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    
    toast({
      title: "Logout realizado",
      description: "Você saiu com segurança. Até a próxima!",
    });

    router.push('/login');
  };

  if (status === 'loading') {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  const user = session?.user;
  if (!user) return null; 

  const fallbackInitial = user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
             <Avatar className="h-10 w-10">
                <AvatarFallback
                    className={cn('text-white font-bold text-lg')}
                    style={{ backgroundColor: user.avatarColor || 'hsl(var(--primary))' }}
                >
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
