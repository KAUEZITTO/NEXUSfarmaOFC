'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, MoreHorizontal, Eye, FileText, Trash2, Download } from "lucide-react";
import { Dispensation, PatientFile } from "@/lib/types";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import type { Patient } from "@/lib/types";
import { updatePatient } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const getColumns = (): ColumnDef<Dispensation>[] => [
  {
    accessorKey: "id",
    header: "ID da Dispensação",
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return <div>{date.toLocaleDateString('pt-BR')}</div>
    }
  },
  {
    accessorKey: "items",
    header: "Nº de Itens",
    cell: ({ row }) => {
      const items = row.getValue("items") as any[];
      return <div className="text-center">{items.length}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const dispensation = row.original

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
              <Link href={`/dispensation-receipt/${dispensation.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Visualizar Recibo
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];

interface PatientHistoryClientPageProps {
  initialPatient: Patient;
  initialDispensations: Dispensation[];
}

export function PatientHistoryClientPage({ initialPatient, initialDispensations }: PatientHistoryClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [patient, setPatient] = useState(initialPatient);
  
  const columns = getColumns();

  const handleRemoveFile = async (fileId: string) => {
    const updatedFiles = patient.files?.filter(f => f.id !== fileId);
    
    try {
      const updatedPatient = await updatePatient(patient.id, { files: updatedFiles });
      setPatient(prev => ({ ...prev, files: updatedFiles }));
      toast({
        title: "Arquivo Removido",
        description: "O anexo foi removido do cadastro do paciente.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Erro ao Remover",
        description: "Não foi possível remover o arquivo.",
      });
    }
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Detalhes do Paciente
                </CardTitle>
                <CardDescription>
                    Informações cadastrais do paciente.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="font-semibold">Nome:</span> {patient.name}</div>
                <div><span className="font-semibold">CPF:</span> {patient.cpf}</div>
                <div><span className="font-semibold">CNS:</span> {patient.cns}</div>
                {patient.unitName && <div><span className="font-semibold">Unidade:</span> {patient.unitName}</div>}
                <div><span className="font-semibold">Demandas:</span> {patient.demandItems?.join(', ') || 'N/A'}</div>
            </CardContent>
        </Card>

        {patient.files && patient.files.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-6 w-6" />
                    Documentos Anexados
                </CardTitle>
                <CardDescription>
                    Laudos, receitas e outros documentos do paciente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <ul className="space-y-2">
                    {patient.files.map(file => (
                       <li key={file.id} className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-md">
                           <div className="flex items-center gap-3">
                               <FileText className="h-4 w-4 text-muted-foreground"/>
                               <div className="flex flex-col">
                                   <span className="font-medium">{file.name}</span>
                                   <span className="text-xs text-muted-foreground">Adicionado em: {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}</span>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <Button variant="outline" size="sm" asChild>
                                   <a href={file.path} download={file.name}>
                                       <Download className="mr-2 h-4 w-4"/>
                                       Baixar
                                   </a>
                               </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Remover Anexo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza que deseja remover o arquivo "{file.name}"? Esta ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveFile(file.id)}>
                                            Sim, remover
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                           </div>
                       </li>
                    ))}
                 </ul>
            </CardContent>
          </Card>
        )}

        <Card>
            <CardHeader>
                <CardTitle>Histórico de Dispensação</CardTitle>
                <CardDescription>
                Acompanhe todas as dispensações de itens para este paciente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={initialDispensations} />
            </CardContent>
        </Card>
    </div>
  );
}
