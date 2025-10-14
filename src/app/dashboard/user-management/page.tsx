
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, MoreHorizontal, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getAllUsers } from "@/lib/data";
import { updateUserAccessLevel, deleteUser } from "@/lib/actions";
import type { User, AccessLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const isUserOnline = (lastSeen?: string) => {
    if (!lastSeen) return false;
    const lastSeenDate = new Date(lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeenDate > fiveMinutesAgo;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchData();
    
    // Also refresh data periodically to update online status
    const interval = setInterval(fetchData, 60000); // every minute
    return () => clearInterval(interval);
  }, []);

  const handleAction = () => {
    router.refresh();
    fetchData();
  }

  const handleAccessLevelChange = async (userId: string, accessLevel: AccessLevel) => {
    try {
        await updateUserAccessLevel(userId, accessLevel);
        toast({
            title: 'Nível de Acesso Atualizado',
            description: `O usuário agora tem permissão de ${accessLevel}.`
        });
        handleAction();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Atualizar',
            description: 'Não foi possível alterar o nível de acesso.'
        });
    }
  };
    
  const handleDeleteUser = async (userId: string) => {
    try {
        await deleteUser(userId);
        toast({
            title: 'Usuário Excluído',
            description: 'O usuário foi removido do sistema com sucesso.'
        });
        handleAction();
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao Excluir',
            description: 'Não foi possível excluir o usuário.'
        });
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
          const user = row.original;
          const online = isUserOnline(user.lastSeen);
          return (
              <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", online ? "bg-green-500" : "bg-gray-400")} title={online ? 'Online' : 'Offline'}></span>
                  <span className="font-medium">{user.email}</span>
              </div>
          )
      },
    },
    {
      accessorKey: "role",
      header: "Cargo",
      cell: ({ row }) => {
          const user = row.original;
          const subRole = user.subRole ? `(${user.subRole})` : '';
          return (
              <div className="capitalize">{user.role} {subRole}</div>
          )
      }
    },
    {
      accessorKey: "accessLevel",
      header: "Nível de Acesso",
      cell: ({ row }) => {
          const level: string = row.getValue("accessLevel");
          return <Badge variant={level === 'Admin' ? 'destructive' : 'secondary'}>{level}</Badge>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <AlertDialog>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Alterar Nível de Acesso</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleAccessLevelChange(user.id, 'Admin')}>
                                  <span>Admin</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAccessLevelChange(user.id, 'User')}>
                                  <span>User</span>
                              </DropdownMenuItem>
                          </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir Usuário</span>
                      </DropdownMenuItem>
                  </AlertDialogTrigger>
              </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialogContent>
                  <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso irá excluir permanentemente a conta de <strong>{user.email}</strong> e remover seus dados de nossos servidores.
                  </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                      Sim, excluir usuário
                  </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
         </AlertDialog>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
        <CardDescription>
          Visualize e gerencie os usuários cadastrados no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 mt-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={users} />
        )}
      </CardContent>
    </Card>
  );
}
