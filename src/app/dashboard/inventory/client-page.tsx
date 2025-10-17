

'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Search, Printer, Loader2, Edit, MoreHorizontal, PlusCircle, Trash2, ShieldX } from "lucide-react";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { zeroStock, deleteProducts } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';


type GroupedProduct = Product & {
    batches: Product[];
};

interface BatchDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: GroupedProduct | null;
}

function BatchDetailsDialog({ isOpen, onOpenChange, product }: BatchDetailsDialogProps) {
  const router = useRouter();

  if (!product) return null;
  
  const { batches, name, presentation, imageUrl } = product;

  const handleProductSaved = () => {
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalhes dos Lotes: {name}</DialogTitle>
          <DialogDescription>
            Apresentação: {presentation}. Total em estoque: {product.quantity.toLocaleString('pt-BR')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-6 max-h-[60vh] overflow-y-auto">
          {imageUrl && (
              <div className="w-1/3">
                  <Image
                      src={imageUrl}
                      alt={`Imagem de ${name}`}
                      width={200}
                      height={200}
                      className="rounded-md object-cover w-full"
                  />
              </div>
          )}
          <div className={imageUrl ? 'w-2/3' : 'w-full'}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Nome Comercial</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map(batch => {
                    let formattedDate = "N/A";
                    if (batch.expiryDate) {
                        const date = new Date(batch.expiryDate);
                        if (!isNaN(date.getTime())) {
                            formattedDate = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                        }
                    }

                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-mono">{batch.batch || 'N/A'}</TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell>{batch.commercialName || 'N/A'}</TableCell>
                        <TableCell>{batch.manufacturer || 'N/A'}</TableCell>
                        <TableCell className="text-right">{batch.quantity.toLocaleString('pt-BR')}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <AddProductDialog productToEdit={batch} onProductSaved={handleProductSaved} trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Editar Lote</span>
                                  </DropdownMenuItem>
                              } />
                              <DropdownMenuItem asChild>
                                  <Link href={`/labels/${batch.id}`} target="_blank" className="w-full h-full flex items-center cursor-pointer">
                                      <Printer className="mr-2 h-4 w-4" />
                                      <span>Imprimir Etiquetas</span>
                                  </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                 <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type FilterCategory = 'Todos' | Product['category'];
const filterCategories: FilterCategory[] = ['Todos', 'Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Fórmulas', 'Não Padronizado (Compra)'];

const groupAndFilterProducts = (products: Product[], filter: FilterCategory, searchTerm: string): GroupedProduct[] => {
    const groupedProductsMap = new Map<string, GroupedProduct>();

    products.forEach(product => {
        const key = `${product.name}|${product.presentation}`;
        const existing = groupedProductsMap.get(key);

        if (existing) {
            existing.batches.push(product);
            existing.quantity += product.quantity;
        } else {
            groupedProductsMap.set(key, {
                ...product,
                id: key, 
                batches: [product],
            });
        }
    });

    let groupedProducts = Array.from(groupedProductsMap.values()).map(group => {
        const total = group.quantity;
        let status: Product['status'] = 'Em Estoque';
        if (total === 0) {
            status = 'Sem Estoque';
        } else if (total < 20) {
            status = 'Baixo Estoque';
        }
        group.status = status;
        return group;
    });

    if (filter !== 'Todos') {
        groupedProducts = groupedProducts.filter(p => p.category === filter);
    }
    
    if (searchTerm) {
        groupedProducts = groupedProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    return groupedProducts.sort((a, b) => a.name.localeCompare(b.name));
}

type ActionType = 'zero' | 'delete';

export function InventoryClientPage({ initialProducts, searchParams }: { initialProducts: Product[], searchParams: { [key: string]: string | string[] | undefined }}) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isPending, startTransition] = useTransition();
  const [isProcessing, setIsProcessing] = useState(false);

  const activeFilter = (searchParams.category as FilterCategory) || 'Todos';
  const searchTerm = (searchParams.q as string) || '';

  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  // Memoize processed products to avoid re-calculation on every render
  const processedProducts = useMemo(() => groupAndFilterProducts(initialProducts, activeFilter, searchTerm), [initialProducts, activeFilter, searchTerm]);

  const handleFilterChange = (key: 'category' | 'q', value: string) => {
    startTransition(() => {
        const params = new URLSearchParams(window.location.search);
        if (value && value !== 'Todos') {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/dashboard/inventory?${params.toString()}`);
    });
  };

  const handleProductSaved = () => {
    router.refresh();
  }

  const handleRowClick = (product: GroupedProduct) => {
      setSelectedProduct(product);
      setIsDialogOpen(true);
  }
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      setSelectedProduct(null);
  }

  const handleMassAction = async (type: ActionType, category?: Product['category']) => {
    setIsProcessing(true);
    let result: { success: boolean, message: string };

    try {
      if (type === 'zero') {
        result = await zeroStock(category);
      } else { // delete
        const productsToProcess = category && category !== 'Todos'
          ? initialProducts.filter(p => p.category === category)
          : initialProducts;
        
        const productIdsToDelete = productsToProcess.map(p => p.id);
        result = await deleteProducts(productIdsToDelete);
      }

      if(result.success) {
          toast({ title: 'Operação Concluída', description: result.message });
      } else {
          toast({ variant: 'destructive', title: 'Erro', description: result.message });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro Inesperado', description: "Ocorreu um erro ao processar a solicitação." });
    } finally {
      setIsProcessing(false);
      router.refresh();
    }
  }
  
  const handleDeleteSelected = async () => {
      const selectedIds = Object.keys(rowSelection);
      if (selectedIds.length === 0) {
          toast({ variant: 'destructive', title: 'Nenhum item selecionado' });
          return;
      }
      
      const allProductIdsToDelete: string[] = [];
      selectedIds.forEach(groupedId => {
          const productGroup = processedProducts.find(p => p.id === groupedId);
          if (productGroup) {
              productGroup.batches.forEach(batch => allProductIdsToDelete.push(batch.id));
          }
      });

      setIsProcessing(true);
      const result = await deleteProducts(allProductIdsToDelete);
      if (result.success) {
          toast({ title: 'Itens Excluídos', description: result.message });
          setRowSelection({}); // Clear selection
      } else {
          toast({ variant: 'destructive', title: 'Erro ao Excluir', description: result.message });
      }
      setIsProcessing(false);
      router.refresh();
  };

  const capitalizeFirstLetter = (string: string) => {
      if (!string) return 'N/A';
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  const columns: ColumnDef<GroupedProduct>[] = useMemo(() => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Selecionar todas as linhas"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Selecionar linha"
            onClick={(e) => e.stopPropagation()} // Prevent row click when interacting with checkbox
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nome <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div className="capitalize font-medium text-primary hover:underline cursor-pointer">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "presentation",
        header: "Apresentação",
        cell: ({ row }) => <div className="capitalize">{row.getValue("presentation") || "N/A"}</div>
      },
      {
        accessorKey: "therapeuticClass",
        header: "Classe",
        cell: ({ row }) => <div className="capitalize">{row.getValue("therapeuticClass") || "N/A"}</div>
      },
      {
        accessorKey: "mainFunction",
        header: "Função",
        cell: ({ row }) => <div>{capitalizeFirstLetter(row.getValue("mainFunction"))}</div>
      },
      {
        accessorKey: "quantity",
        header: () => <div className="text-right">Quantidade Total</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("quantity"))
          return <div className="text-right font-medium">{amount.toLocaleString('pt-BR')}</div>
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status: string = row.getValue("status");
          const variantMap: { [key: string]: "destructive" | "secondary" | "default" } = {
            'Sem Estoque': 'destructive',
            'Baixo Estoque': 'secondary',
            'Em Estoque': 'default'
          };
          
          return <Badge 
            variant={variantMap[status] ?? 'default'}
            className={cn(status === 'Baixo Estoque' && 'bg-accent text-accent-foreground')}
          >
            {status}
          </Badge>
        },
      },
  ], []);

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <Card>
        <CardHeader>
            <CardTitle>Inventário de Produtos</CardTitle>
            <CardDescription>
            Gerencie seus produtos, adicione novos e acompanhe o estoque. Itens agrupados por nome e apresentação.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div className="flex items-center space-x-2 pt-2 overflow-x-auto pb-2">
                    {filterCategories.map(filter => (
                        <Button 
                            key={filter}
                            variant={activeFilter === filter ? "default" : "outline"}
                            onClick={() => handleFilterChange('category', filter)}
                            className="rounded-full flex-shrink-0"
                            disabled={isPending || isProcessing}
                        >
                            {(isPending || isProcessing) && activeFilter === filter ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            {filter}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2 items-center">
                    {selectedRowCount > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isProcessing}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Selecionados ({selectedRowCount})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Itens Selecionados?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. Isso excluirá permanentemente os {selectedRowCount} grupos de produtos selecionados e todos os seus lotes.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteSelected} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                        Sim, excluir itens
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button variant="outline" asChild>
                        <Link href="/shelf-labels" target="_blank">
                            <Printer className="mr-2 h-4 w-4" />
                            Etiquetas de Prateleira
                        </Link>
                    </Button>
                     <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="destructive" disabled={isProcessing}>
                                    <ShieldX className="mr-2 h-4 w-4" />
                                    Ações em Massa
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Zerar Estoque</DropdownMenuLabel>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem disabled={activeFilter === 'Todos'} onSelect={(e) => e.preventDefault()}>
                                        Zerar Estoque da Categoria "{activeFilter}"
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        Zerar Estoque Completo
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Excluir Produtos</DropdownMenuLabel>
                                 <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={activeFilter === 'Todos'} onSelect={(e) => e.preventDefault()}>
                                        Excluir Produtos da Categoria "{activeFilter}"
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        Excluir TODOS os Produtos
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Pense bem antes de continuar.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                            {/* We use a generic handler and figure out the action inside the dialog. This is not ideal, a state machine would be better, but it works for this limited scope. */}
                            <AlertDialogAction onClick={() => handleMassAction('zero', activeFilter)} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Zerar Estoque
                            </AlertDialogAction>
                             <AlertDialogAction onClick={() => handleMassAction('delete', activeFilter)} disabled={isProcessing} className="bg-destructive hover:bg-destructive/90">
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Excluir Produtos
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <AddProductDialog onProductSaved={handleProductSaved} trigger={
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Adicionar Produto
                        </Button>
                    } />
                </div>
            </div>
            
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Filtrar por nome..."
                    defaultValue={searchTerm}
                    onChange={(e) => handleFilterChange('q', e.target.value)}
                    className="pl-10 max-w-sm"
                />
                {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
            </div>
        
            <DataTable 
              columns={columns} 
              data={processedProducts} 
              onRowClick={handleRowClick}
              rowSelection={rowSelection}
              setRowSelection={setRowSelection}
            />
        
            <BatchDetailsDialog
                isOpen={isDialogOpen}
                onOpenChange={handleDialogClose}
                product={selectedProduct}
            />
        </CardContent>
    </Card>
  );
}
