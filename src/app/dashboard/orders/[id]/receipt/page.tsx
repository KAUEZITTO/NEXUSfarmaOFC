'use client';

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  batch?: string;
  expiryDate?: string;
  presentation?: string;
};

type OrderCategory = "medicines" | "technical_material" | "odontological_items" | "laboratory_items";

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
  <TableRow className="bg-muted hover:bg-muted">
    <TableCell colSpan={5} className="font-bold text-md text-muted-foreground tracking-wide uppercase">
      {children}
    </TableCell>
  </TableRow>
);

const renderItemRows = (items: OrderItem[]) => {
    return items.map((item) => (
        <TableRow key={item.productId}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="text-center">{item.presentation || "--"}</TableCell>
            <TableCell className="text-center">{item.batch || "--"}</TableCell>
            <TableCell className="text-center">{item.expiryDate || "--"}</TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
        </TableRow>
    ));
}


export default function ReceiptPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch order data based on params.id
  // const order = await fetchOrder(params.id);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black shadow-lg print:shadow-none">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Logo />
          <p className="text-sm -ml-2 mt-1">Termo de Recebimento</p>
        </div>
        <div className="text-right">
            <h2 className="font-bold text-lg">PREFEITURA MUNICIPAL DE IGARAPÉ-AÇU</h2>
            <p className="text-sm">SECRETARIA MUNICIPAL DE SAÚDE</p>
            <p className="text-sm">FARMÁCIA CENTRAL</p>
        </div>
      </header>
      <Separator className="my-4 bg-gray-400" />
      <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
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
        <Table>
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

      <div className="mt-20">
        <div className="w-1/2 mx-auto">
          <div className="border-t border-black"></div>
          <p className="text-center mt-2">Assinatura do Recebedor</p>
        </div>
      </div>
      <p className="text-xs text-center mt-8 text-gray-500">
        Este documento é gerado em duas vias.
      </p>

      <div className="fixed bottom-4 right-4 print:hidden">
         <Button onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
        </Button>
      </div>
    </div>
  );
}
