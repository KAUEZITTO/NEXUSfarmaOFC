'use client';

import { useRouter } from 'next/navigation';
import type { HospitalSector } from '@/lib/types';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteHospitalSector } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AddSectorDialog } from './add-sector-dialog';

export function HospitalSectorsClientPage({ initialSectors }: { initialSectors: HospitalSector[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleSectorSaved = () => {
    router.refresh();
  };

  const handleDeleteSector = async (sectorId: string, sectorName: string) => {
    const result = await deleteHospitalSector(sectorId);
    if (result.success) {
        toast({
            title: 'Setor Excluído',
            description: `O setor "${sectorName}" foi removido com sucesso.`
        });
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Erro ao Excluir',
            description: result.message || 'Não foi possível excluir o setor.'
        });
    }
  }

  const columns: ColumnDef<HospitalSector>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <div className="capitalize font-medium">{row.getValue('name')}</div>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Descrição',
      cell: ({ row }) => <div>{row.getValue('description') || 'N/A'}</div>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const sector = row.original;

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
                <AddSectorDialog
                  sectorToEdit={sector}
                  onSectorSaved={handleSectorSaved}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar Setor</span>
                    </DropdownMenuItem>
                  }
                />
                 <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir Setor</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá excluir permanentemente o setor <strong>{sector.name}</strong>. Dispensações antigas manterão o nome do setor, mas ele não poderá ser usado para novas dispensações.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteSector(sector.id, sector.name)}>
                    Sim, excluir setor
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
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div>
            <CardTitle>Gerenciar Setores do Hospital</CardTitle>
            <CardDescription>
              Cadastre e gerencie os setores internos que recebem materiais.
            </CardDescription>
          </div>
          <AddSectorDialog
            onSectorSaved={handleSectorSaved}
            trigger={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Setor
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
          <DataTable columns={columns} data={initialSectors} />
      </CardContent>
    </Card>
  );
}
