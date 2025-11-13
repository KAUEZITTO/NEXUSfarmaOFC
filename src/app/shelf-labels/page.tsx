
'use client';

import React, { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Loader2 } from 'lucide-react';
import { useDebounce } from 'use-debounce';

const predefinedSizes = [
    { name: 'Pimaco A4 (6181)', width: 63.5, height: 38.1, cols: 3, rows: 7, type: 'page' },
    { name: 'Rolo 100mm x 50mm', width: 100, height: 50, type: 'roll' },
    { name: 'Rolo 50mm x 30mm', width: 50, height: 30, type: 'roll' },
    { name: 'Rolo 40mm x 25mm', width: 40, height: 25, type: 'roll' },
    { name: 'Rolo 35mm x 22mm', width: 35, height: 22, type: 'roll' },
    { name: 'Personalizado', width: 100, height: 50, type: 'roll' },
];

const ShelfLabel = ({ product, width, height }: { product: Product, width: number, height: number }) => {
    const isSmall = width < 50 || height < 30;

    return (
        <div className="p-1 border border-black border-dashed flex flex-col justify-between h-full bg-white text-black break-words" style={{fontSize: isSmall ? '8px' : '10px', lineHeight: '1.2'}}>
            <div className="text-center">
                <p className="font-bold bg-black text-white uppercase tracking-wider py-0.5 px-1 -m-1 mb-1" style={{fontSize: isSmall ? '7px' : '9px'}}>{product.category}</p>
                <p className="font-bold mt-1 leading-tight" style={{fontSize: isSmall ? '10px' : '14px'}}>{product.name}</p>
                <p className="text-gray-700" style={{fontSize: isSmall ? '7px' : '9px'}}>{product.presentation}</p>
            </div>
            <div className="text-center mt-auto">
                <p className="text-gray-500" style={{fontSize: '7px'}}>Posicione esta etiqueta na prateleira.</p>
            </div>
        </div>
    );
};

export default function ShelfLabelsPage() {
    const { toast } = useToast();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const [selectedSize, setSelectedSize] = useState(predefinedSizes[0]);
    const [customWidth, setCustomWidth] = useState(100);
    const [customHeight, setCustomHeight] = useState(50);

    React.useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const fetchedProducts = await getProducts('all');
                const groupedProductsMap = new Map<string, Product>();
                fetchedProducts.forEach(product => {
                    const key = `${product.name}|${product.presentation}`;
                    if (!groupedProductsMap.has(key)) {
                        groupedProductsMap.set(key, product);
                    }
                });
                const uniqueProducts = Array.from(groupedProductsMap.values()).sort((a, b) => {
                    if (a.category < b.category) return -1; if (a.category > b.category) return 1;
                    if (a.name < b.name) return -1; if (a.name > b.name) return 1;
                    return 0;
                });
                setAllProducts(uniqueProducts);
                setFilteredProducts(uniqueProducts);
            } catch (err) {
                toast({ variant: 'destructive', title: 'Erro ao buscar produtos' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, [toast]);
    
    useMemo(() => {
        const lowerSearch = debouncedSearchTerm.toLowerCase();
        const result = allProducts.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.category.toLowerCase().includes(lowerSearch));
        setFilteredProducts(result);
    }, [debouncedSearchTerm, allProducts]);

    const handlePrint = () => {
        const size = selectedSize.name === 'Personalizado' ? { ...selectedSize, width: customWidth, height: customHeight } : selectedSize;

        const content = filteredProducts.map(p => `
            <div style="width: ${size.width}mm; height: ${size.height}mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 4px; border: 1px dashed black; page-break-inside: avoid; background: white; color: black; font-family: sans-serif; font-size: ${size.height < 30 ? '8px' : '10px'}; line-height: 1.2;">
                <div style="text-align: center;">
                    <p style="font-weight: bold; background-color: black; color: white; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px; margin: -4px -4px 4px -4px; font-size: ${size.height < 30 ? '7px' : '9px'}">${p.category}</p>
                    <p style="font-weight: bold; margin-top: 4px; line-height: 1.1; font-size: ${size.height < 30 ? '10px' : '14px'}">${p.name}</p>
                    <p style="color: #4A5568; font-size: ${size.height < 30 ? '7px' : '9px'}">${p.presentation || ''}</p>
                </div>
                <div style="text-align: center; margin-top: auto;">
                    <p style="color: #A0AEC0; font-size: 7px;">Posicione esta etiqueta na prateleira.</p>
                </div>
            </div>
        `).join('');

        let printWindow = window.open('', '_blank');
        if (printWindow) {
            let bodyContent = '';
            if (size.type === 'page' && size.cols && size.rows) {
                const labelsPerPage = size.cols * size.rows;
                const pageCount = Math.ceil(filteredProducts.length / labelsPerPage);
                for (let i = 0; i < pageCount; i++) {
                    const pageLabels = filteredProducts.slice(i * labelsPerPage, (i + 1) * labelsPerPage);
                    bodyContent += `
                        <div style="display: grid; grid-template-columns: repeat(${size.cols}, ${size.width}mm); grid-template-rows: repeat(${size.rows}, ${size.height}mm); width: 210mm; height: 297mm; page-break-after: always;">
                            ${pageLabels.map(p => {
                                // Re-render label content for each product on the page
                                return `
                                    <div style="width: ${size.width}mm; height: ${size.height}mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 4px; border: 1px dashed black; background: white; color: black; font-family: sans-serif; font-size: ${size.height < 30 ? '8px' : '10px'}; line-height: 1.2;">
                                        <div style="text-align: center;">
                                            <p style="font-weight: bold; background-color: black; color: white; text-transform: uppercase; letter-spacing: 0.05em; padding: 2px; margin: -4px -4px 4px -4px; font-size: ${size.height < 30 ? '7px' : '9px'}">${p.category}</p>
                                            <p style="font-weight: bold; margin-top: 4px; line-height: 1.1; font-size: ${size.height < 30 ? '10px' : '14px'}">${p.name}</p>
                                            <p style="color: #4A5568; font-size: ${size.height < 30 ? '7px' : '9px'}">${p.presentation || ''}</p>
                                        </div>
                                        <div style="text-align: center; margin-top: auto;">
                                            <p style="color: #A0AEC0; font-size: 7px;">Posicione esta etiqueta na prateleira.</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
            } else { // roll
                bodyContent = content;
            }

            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir Etiquetas</title>
                        <style>
                            @page { size: ${size.type === 'page' ? 'A4' : `${size.width}mm ${size.height}mm`}; margin: 0; }
                            body { margin: 0; display: flex; flex-direction: ${size.type === 'page' ? 'column' : 'column'}; flex-wrap: wrap; }
                        </style>
                    </head>
                    <body>${bodyContent}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow!.print();
            }, 500);
        }
    };


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Imprimir Etiquetas de Prateleira</CardTitle>
                    <CardDescription>Selecione os produtos e o formato da etiqueta para impressão.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="label-size">Tamanho da Etiqueta</Label>
                            <Select onValueChange={(val) => setSelectedSize(predefinedSizes.find(s => s.name === val) || predefinedSizes[0])} defaultValue={selectedSize.name}>
                                <SelectTrigger id="label-size"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {predefinedSizes.map(s => <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedSize.name === 'Personalizado' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-width">Largura (mm)</Label>
                                    <Input id="custom-width" type="number" value={customWidth} onChange={e => setCustomWidth(parseInt(e.target.value, 10))} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-height">Altura (mm)</Label>
                                    <Input id="custom-height" type="number" value={customHeight} onChange={e => setCustomHeight(parseInt(e.target.value, 10))} />
                                </div>
                            </>
                        )}
                    </div>
                     <div className="mt-6">
                        <Label htmlFor="search-product">Filtrar Produtos</Label>
                        <Input id="search-product" placeholder="Digite para buscar por nome ou categoria..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Produtos para Impressão ({filteredProducts.length})</CardTitle>
                        <Button onClick={handlePrint} disabled={filteredProducts.length === 0}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir {filteredProducts.length} etiqueta(s)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="h-96 overflow-y-auto border rounded-md p-4 space-y-2">
                     {isLoading ? <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div> : 
                        filteredProducts.length > 0 ? filteredProducts.map(p => (
                            <div key={p.id} className="p-2 border rounded-md bg-muted/50">
                                <p className="font-semibold">{p.name} <span className="font-normal text-muted-foreground">- {p.presentation}</span></p>
                                <p className="text-sm text-muted-foreground">{p.category}</p>
                            </div>
                        )) : <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum produto encontrado.</div>
                    }
                </CardContent>
            </Card>
        </div>
    );
}
