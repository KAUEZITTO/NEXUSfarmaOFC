
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HospitalPatient, HospitalPatientStatus, Product } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, ArrowUpDown, Edit, Pill, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { updateHospitalPatientStatus, deleteHospitalPatient } from '@/lib/actions';
import { AddHospitalPatientDialog } from './add-patient-dialog';
import { Input } from '@/components/ui/input';

interface HospitalPatientsClientPageProps {
    initialPatients: HospitalPatient[];
    hospitalInventory: Product[];
}

export function HospitalPatientsClientPage({ initialPatients, hospitalInventory }: HospitalPatientsClientPageProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = initialPatients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.bedNumber.includes(searchTerm));

    const handlePatientSaved = () => {
        toast({ title: "Sucesso", description: "Dados do paciente salvos."});
        router.refresh();
    }

    const handleDelete = async (patientId: string) => {
        try {
            await deleteHospitalPatient(patientId);
            toast({ title: "Paciente Excluído", description: "O paciente foi removido do sistema."});
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir o paciente."});
        }
    }
    
    const handleStatusChange = async (patientId: string, status: HospitalPatientStatus) => {
         try {
            await updateHospitalPatientStatus(patientId, status);
            toast({ title: "Status Alterado", description: `O status do paciente foi alterado para ${status}.`});
            router.refresh();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar o status."});
        }
    }

    const columns: ColumnDef<HospitalPatient>[] = [
        {
            accessorKey: 'name',
            header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nome <ArrowUpDown className="ml-2 h-4 w-4" /></Button>,
        },
        {
            accessorKey: 'bedNumber',
            header: 'Leito',
        },
        {
            accessorKey: 'admissionDate',
            header: 'Data de Admissão',
            cell: ({ row }) => new Date(row.getValue('admissionDate')).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.getValue('status') as HospitalPatientStatus;
                return <Badge variant={status === 'Internado' ? 'default' : 'secondary'} className={cn({'bg-green-600': status === 'Internado'})}>{status}</Badge>
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const patient = row.original;
                return (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <AddHospitalPatientDialog onPatientSaved={handlePatientSaved} patientToEdit={patient} hospitalInventory={hospitalInventory} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>} />
                                <DropdownMenuItem disabled><Pill className="mr-2 h-4 w-4"/> Ver Dispensações</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger>Alterar Status</DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent>
                                            {(['Internado', 'Alta', 'Transferido', 'Óbito'] as HospitalPatientStatus[]).map(status => (
                                                <DropdownMenuItem key={status} onClick={() => handleStatusChange(patient.id, status)}>{status}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                                <DropdownMenuSeparator />
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="mr-2 h-4 w-4"/> Excluir</DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Paciente?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita. Deseja excluir permanentemente o registro de {patient.name}?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(patient.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )
            }
        }
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap gap-4 justify-between items-center">
                    <div>
                        <CardTitle>Pacientes Internados</CardTitle>
                        <CardDescription>Gerencie os pacientes atualmente internados na unidade hospitalar.</CardDescription>
                    </div>
                     <AddHospitalPatientDialog onPatientSaved={handlePatientSaved} hospitalInventory={hospitalInventory} trigger={
                        <Button><PlusCircle className="mr-2 h-4 w-4" /> Registrar Paciente</Button>
                    } />
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Input placeholder="Buscar por nome ou leito..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-sm" />
                </div>
                <DataTable columns={columns} data={filteredPatients} />
            </CardContent>
        </Card>
    );
}
