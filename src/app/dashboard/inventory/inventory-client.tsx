
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Search, Printer, Loader2, Edit, MoreHorizontal } from "lucide-react";
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
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddProductDialog } from '@/components/dashboard/add-product-dialog';


// --- Type definition is now local to the client component ---
type GroupedProduct = Product & {
    batches: Product[];
};

// --- BatchDetailsDialog component is now local ---
interface BatchDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: GroupedProduct | null;
  onProductSaved: () => void;
}

function BatchDetailsDialog({ isOpen, onOpenChange, product, onProductSaved }: BatchDetailsDialogProps) {
  if (!product) return null;
  
  const { batches, name, presentation, imageUrl } = product;

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
                {batches.map(batch => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono">{batch.batch || 'N/A'}</TableCell>
                    <TableCell>{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</TableCell>
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
                           <AddProductDialog productToEdit={batch} onProductSaved={onProductSaved} trigger={
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
                ))}
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

// --- Main Client Component ---
type FilterCategory = 'Todos' | Product['category'];

const filterCategories: FilterCategory[] = ['Todos', 'Medicamento', 'Material Técnico', 'Odontológico', 'Laboratório', 'Fraldas', 'Não Padronizado (Compra)'];

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

    return groupedProducts;
}

interface InventoryClientProps {
    rawProducts: Product[];
    children: React.ReactNode; // To accept the AddProductDialog as a child
    onProductSaved: () => void;
}

export default function InventoryClient({ rawProducts, children, onProductSaved }: InventoryClientProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [isPending, startTransition] = useTransition();

  const [selectedProduct, setSelectedProduct] = useState<GroupedProduct | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRowClick = (product: GroupedProduct) => {
      setSelectedProduct(product);
      setIsDialogOpen(true);
  }
  
  const handleDialogClose = () => {
      setIsDialogOpen(false);
      onProductSaved();
  }

  useEffect(() => {
    startTransition(() => {
        const processedProducts = groupAndFilterProducts(rawProducts, activeFilter, searchTerm);
        setProducts(processedProducts);
    })
  }, [rawProducts, activeFilter, searchTerm]);

  // --- Columns definition is now INSIDE the component ---
  const capitalizeFirstLetter = (string: string) => {
      if (!string) return 'N/A';
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  const columns: ColumnDef<GroupedProduct>[] = [
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
  ];

  return (
    <>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex items-center space-x-2 pt-2 overflow-x-auto pb-2">
                {filterCategories.map(filter => (
                    <Button 
                        key={filter}
                        variant={activeFilter === filter ? "default" : "outline"}
                        onClick={() => setActiveFilter(filter)}
                        className="rounded-full flex-shrink-0"
                    >
                        {filter}
                    </Button>
                ))}
            </div>
             <div className="flex gap-2">
                <Button variant="outline" asChild>
                    <Link href="/shelf-labels" target="_blank">
                        <Printer className="mr-2 h-4 w-4" />
                        Etiquetas de Prateleira
                    </Link>
                </Button>
                {children}
             </div>
        </div>
        
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-sm"
            />
            {isPending && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
        </div>
      
        <DataTable columns={columns} data={products} onRowClick={handleRowClick} />
        
        <BatchDetailsDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            product={selectedProduct}
            onProductSaved={handleDialogClose}
        />
    </>
  );
}
