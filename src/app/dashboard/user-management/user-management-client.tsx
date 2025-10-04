'use client';

import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./columns";
import type { User, AccessLevel } from "@/lib/types";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { updateUserAccessLevel, deleteUser } from "@/lib/actions";

interface UserManagementClientProps {
    initialUsers: User[];
}

export function UserManagementClient({ initialUsers }: UserManagementClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleAccessLevelChange = async (userId: string, accessLevel: AccessLevel) => {
        startTransition(async () => {
            try {
                await updateUserAccessLevel(userId, accessLevel);
                toast({
                    title: 'Nível de Acesso Atualizado',
                    description: `O usuário agora tem permissão de ${accessLevel}.`
                });
                router.refresh();
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Atualizar',
                    description: 'Não foi possível alterar o nível de acesso.'
                });
            }
        });
    }
    
    const handleDeleteUser = async (userId: string) => {
         startTransition(async () => {
            try {
                await deleteUser(userId);
                toast({
                    title: 'Usuário Excluído',
                    description: 'O usuário foi removido do sistema com sucesso.'
                });
                router.refresh();
            } catch (error) {
                 toast({
                    variant: 'destructive',
                    title: 'Erro ao Excluir',
                    description: 'Não foi possível excluir o usuário.'
                });
            }
        });
    }

    const columns = getColumns({ onAccessLevelChange: handleAccessLevelChange, onDeleteUser: handleDeleteUser });
    
    return (
        <DataTable columns={columns} data={initialUsers} filterColumn="email" />
    );
}
