
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
import { ArrowUpDown, MoreHorizontal, Check, X, Edit, Eye, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function UnitsClientPage({ initialUnits }: { initialUnits: Unit[] }) {
  const router = useRouter();

  const handleUnitSaved = () => {
    router.refresh();
  };

  const getColumns = (onUnitSaved: () => void): ColumnDef<Unit>[] => [
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
        return (
          <div className="capitalize font-medium">{row.getValue('name')}</div>
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
                onUnitSaved={onUnitSaved}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Editar Unidade</span>
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const columns = getColumns(handleUnitSaved);

  const handleRowClick = (unit: Unit) => {
    router.push(`/dashboard/units/${unit.id}`);
  };

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
          <DataTable columns={columns} data={initialUnits} onRowClick={handleRowClick} />
      </CardContent>
    </Card>
  );
}
