
'use client';

import { useRouter } from 'next/navigation';
import type { Unit } from '@/lib/types';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddUnitDialog } from '@/components/dashboard/add-unit-dialog';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Check, X, Edit, Eye, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteUnit } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

export function UnitsClientPage({ initialUnits }: { initialUnits: Unit[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const handleUnitSaved = () => {
    router.refresh();
  };

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    const result = await deleteUnit(unitId);
    if (result.success) {
        toast({
            title: 'Unidade Excluída',
            description: `A unidade "${unitName}" foi removida com sucesso.`
        });
        router.refresh();
    } else {
        toast({
            variant: 'destructive',
            title: 'Erro ao Excluir',
            description: result.message || 'Não foi possível excluir a unidade. Tente novamente.'
        });
    }
  }

  const columns: ColumnDef<Unit>[] = [
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
        const unit = row.original;
        return (
          <Link href={`/dashboard/units/${unit.id}`} className="capitalize font-medium text-primary hover:underline">
            {row.getValue('name')}
          </Link>
        );
      },
    },
    {
      accessorKey: 'address',
      header: 'Endereço',
    },
    {
      accessorKey: 'coordinatorName',
      header: 'Coordenador(a)',
      cell: ({ row }) => <div>{row.getValue('coordinatorName') || 'N/A'}</div>,
    },
    {
      accessorKey: 'hasPharmacy',
      header: 'Farmácia',
      cell: ({ row }) => {
        const hasPharmacy = row.getValue('hasPharmacy');
        return hasPharmacy ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        );
      },
    },
    {
      accessorKey: 'hasDentalOffice',
      header: 'Odonto',
      cell: ({ row }) => {
        const hasOffice = row.getValue('hasDentalOffice');
        return hasOffice ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const unit = row.original;

        return (
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/units/${unit.id}`}
                    className="w-full h-full flex items-center cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AddUnitDialog
                  unitToEdit={unit}
                  onUnitSaved={handleUnitSaved}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Editar Unidade</span>
                    </DropdownMenuItem>
                  }
                />
                 <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir Unidade</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso irá excluir permanentemente a unidade <strong>{unit.name}</strong> e remover seus dados de nossos servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteUnit(unit.id, unit.name)}>
                    Sim, excluir unidade
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Unidades</CardTitle>
            <CardDescription>
              Cadastre e gerencie as unidades que recebem os produtos.
            </CardDescription>
          </div>
          <AddUnitDialog
            onUnitSaved={handleUnitSaved}
            trigger={
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Unidade
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
          <DataTable columns={columns} data={initialUnits} />
      </CardContent>
    </Card>
  );
}
