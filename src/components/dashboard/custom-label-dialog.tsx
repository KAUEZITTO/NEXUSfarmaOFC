'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Printer } from 'lucide-react';
import { Barcode } from '@/app/labels/[productId]/barcode';

const predefinedSizes = [
    { name: 'Pimaco A4 (63.5 x 38.1mm)', width: 63.5, height: 38.1, cols: 3, rows: 7, type: 'page' },
    { name: 'Rolo 100mm x 50mm', width: 100, height: 50, type: 'roll' },
    { name: 'Rolo 50mm x 30mm', width: 50, height: 30, type: 'roll' },
    { name: 'Rolo 40mm x 25mm', width: 40, height: 25, type: 'roll' },
    { name: 'Personalizado', width: 100, height: 50, type: 'roll' },
];

export function CustomLabelDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [batch, setBatch] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(predefinedSizes[0]);
  const [customWidth, setCustomWidth] = useState(100);
  const [customHeight, setCustomHeight] = useState(50);
  
  const handlePrint = () => {
    const size = selectedSize.name === 'Personalizado' ? { ...selectedSize, width: customWidth, height: customHeight } : selectedSize;
    const barcodeValue = `${batch}-${expiryDate.replace(/-/g, '')}`;

    const labelContent = (
      <div style={{
          width: `${size.width}mm`,
          height: `${size.height}mm`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '2mm',
          border: '1px dashed black',
          fontFamily: 'sans-serif',
          fontSize: '8px',
          lineHeight: '1.2',
          background: 'white',
          color: 'black',
          pageBreakInside: 'avoid',
      }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 'bold' }}>Lote: {batch || 'N/A'}</div>
              <div style={{ fontWeight: 'bold' }}>Val: {expiryDate ? new Date(expiryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}</div>
          </div>
          <div style={{ textAlign: 'center', margin: '2px 0', fontSize: '10px', fontWeight: 'bold' }}>
              {productName}
          </div>
          <div style={{ marginTop: 'auto', width: '100%', textAlign: 'center' }}>
              <svg id="barcode-svg" class="w-full max-w-[80%]"></svg>
          </div>
      </div>
    );

    let contentToPrint = '';
    const labelHtmlString = `
      <div style="width: ${size.width}mm; height: ${size.height}mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; padding: 2mm; border: 1px dashed black; font-family: sans-serif; font-size: 8px; line-height: 1.2; background: white; color: black; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <div>Lote: ${batch || 'N/A'}</div>
              <div>Val: ${expiryDate ? new Date(expiryDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</div>
          </div>
          <div style="text-align: center; margin: 2px 0; font-size: 10px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${productName}
          </div>
          <div style="margin-top: auto; width: 100%; text-align: center;">
              <svg class="barcode-placeholder" data-value="${barcodeValue}"></svg>
          </div>
      </div>
    `;

    if (size.type === 'page' && size.cols && size.rows) {
        const labelsPerPage = size.cols * size.rows;
        const pageCount = Math.ceil(quantity / labelsPerPage);
        let remainingLabels = quantity;
        for (let i = 0; i < pageCount; i++) {
            let pageLabelsHtml = '';
            const labelsOnThisPage = Math.min(remainingLabels, labelsPerPage);
            for (let j = 0; j < labelsOnThisPage; j++) {
                pageLabelsHtml += labelHtmlString;
            }
            contentToPrint += `<div style="display: grid; grid-template-columns: repeat(${size.cols}, ${size.width}mm); grid-gap: 0; width: 210mm; height: 297mm; page-break-after: always;">${pageLabelsHtml}</div>`;
            remainingLabels -= labelsOnThisPage;
        }
    } else { // roll
        for (let i = 0; i < quantity; i++) {
            contentToPrint += labelHtmlString;
        }
    }

    let printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Imprimir Etiquetas</title>
                    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                    <style>
                        @page { size: ${size.type === 'page' ? 'A4' : `${size.width}mm ${size.height}mm`}; margin: ${size.type === 'page' ? '10mm' : '0'}; }
                        body { margin: 0; }
                    </style>
                </head>
                <body>
                    ${contentToPrint}
                    <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            document.querySelectorAll('.barcode-placeholder').forEach(function(svg) {
                                JsBarcode(svg, svg.getAttribute('data-value'), {
                                    format: 'CODE128',
                                    displayValue: false,
                                    margin: 0,
                                    height: 15,
                                    width: 1,
                                });
                            });
                            setTimeout(() => {
                                window.print();
                                window.close();
                            }, 500);
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Etiquetas Personalizadas</DialogTitle>
          <DialogDescription>
            Preencha as informações para criar etiquetas para impressão.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="productName">Nome do Produto</Label>
                    <Input id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="batch">Lote</Label>
                    <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="expiryDate">Data de Validade</Label>
                    <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade de Etiquetas</Label>
                <Input id="quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>

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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Gerar e Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
