
'use client';

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import { products } from "@/lib/data";
import { Product } from "@/lib/types";
import { Logo } from "@/components/logo";
import Image from "next/image";

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  batch?: string;
  expiryDate?: string;
  presentation?: string;
};

// Helper function to create order items from product data
const createOrderItem = (productId: string, quantity: number): OrderItem | null => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return {
        productId: product.id,
        name: product.name,
        quantity: quantity,
        batch: product.batch,
        expiryDate: product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('pt-BR') : undefined,
        presentation: product.presentation
    };
}


// Mock data for a single order
const orderData = {
  id: "ORD001",
  unit: "UBS Centro",
  date: "20 de Maio de 2024",
  items: {
    medicines: [
      createOrderItem("PROD001", 50), // Dipirona 500mg
      createOrderItem("PROD006", 100), // Paracetamol 750mg
    ].filter(Boolean) as OrderItem[],
    technical_material: [
      createOrderItem("PROD002", 200), // Seringa 10ml
      createOrderItem("PROD003", 2), // Luva de Procedimento (M)
    ].filter(Boolean) as OrderItem[],
    odontological_items: [
        createOrderItem("PROD004", 5) // Resina Composta Z350
    ].filter(Boolean) as OrderItem[],
    laboratory_items: [],
  },
};

const CategoryTitle = ({ children }: { children: React.ReactNode }) => (
  <TableRow className="bg-muted/5 hover:bg-muted/5">
    <TableCell colSpan={5} className="font-bold text-md text-muted-foreground tracking-wide uppercase">
      {children}
    </TableCell>
  </TableRow>
);

const renderItemRows = (items: OrderItem[]) => {
    return items.map((item) => (
        <TableRow key={item.productId} className="border-b">
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-center">{item.presentation || "--"}</TableCell>
            <TableCell className="text-center">{item.batch || "--"}</TableCell>
            <TableCell className="text-center">{item.expiryDate || "--"}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
        </TableRow>
    ));
}

const ReceiptCopy = ({ showSignature, isFirstCopy }: { showSignature: boolean, isFirstCopy: boolean }) => (
  <div className={`max-w-4xl mx-auto bg-white text-black ${isFirstCopy ? 'shadow-lg print:shadow-none page-break-after' : ''}`}>
    <div className="p-8">
      <header className="mb-4">
        <div className="grid grid-cols-3 items-center text-center border-b pb-4 border-gray-400">
            <div className="flex flex-col items-center justify-center">
                <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={80} height={80} data-ai-hint="city hall government" />
                <p className="text-xs font-bold mt-1 max-w-40">PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU</p>
            </div>

            <div className="flex flex-col items-center justify-center">
                <Logo />
                <p className="text-sm mt-1 font-semibold">GUIA DE ENTREGA</p>
            </div>

            <div className="flex flex-col items-center justify-center">
                  <Image src="/CAF.png" alt="Logo CAF" width={80} height={80} data-ai-hint="pharmacy cross" />
                  <p className="text-xs font-bold mt-1">CAF - CENTRO DE ABASTÊCIMENTO FARMACÊUTICO</p>
            </div>
        </div>
      </header>
      
      <div className="grid grid-cols-3 gap-4 my-6 text-sm">
        <div>
          <p className="font-bold">Unidade de Destino:</p>
          <p>{orderData.unit}</p>
        </div>
        <div>
          <p className="font-bold">Data do Pedido:</p>
          <p>{orderData.date}</p>
        </div>
        <div>
          <p className="font-bold">ID do Pedido:</p>
          <p>{orderData.id}</p>
        </div>
      </div>

      <div>
        <Table className="border-none">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[45%] font-semibold">Item</TableHead>
              <TableHead className="text-center font-semibold">Apresentação</TableHead>
              <TableHead className="text-center font-semibold">Lote</TableHead>
              <TableHead className="text-center font-semibold">Validade</TableHead>
              <TableHead className="text-right font-semibold">Quantidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderData.items.medicines.length > 0 && (
              <>
                <CategoryTitle>Medicamentos</CategoryTitle>
                {renderItemRows(orderData.items.medicines)}
              </>
            )}
            {orderData.items.technical_material.length > 0 && (
              <>
                <CategoryTitle>Material Técnico</CategoryTitle>
                {renderItemRows(orderData.items.technical_material)}
              </>
            )}
            {orderData.items.odontological_items.length > 0 && (
              <>
                <CategoryTitle>Itens Odontológicos</CategoryTitle>
                {renderItemRows(orderData.items.odontological_items)}
              </>
            )}
            {orderData.items.laboratory_items.length > 0 && (
              <>
                <CategoryTitle>Itens de Laboratório</CategoryTitle>
                  {renderItemRows(orderData.items.laboratory_items)}
              </>
            )}
          </TableBody>
        </Table>
      </div>
      
      {showSignature && (
        <div className="mt-20">
          <div className="w-1/2 mx-auto">
            <div className="border-t border-black"></div>
            <p className="text-center mt-2">Assinatura do Recebedor</p>
          </div>
        </div>
      )}
       <p className="text-xs text-center mt-8 text-gray-500">
        {isFirstCopy ? "1ª VIA - CAF" : "2ª VIA - UNIDADE"}
      </p>
    </div>
  </div>
);


export default function ReceiptPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch order data based on params.id
  // const order = await fetchOrder(params.id);

  return (
    <>
      <div className="print-container">
        <ReceiptCopy showSignature={true} isFirstCopy={true} />
        <ReceiptCopy showSignature={false} isFirstCopy={false} />
      </div>

      <div className="fixed bottom-4 right-4 print:hidden">
          <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
        </Button>
      </div>
    </>
  );
}
