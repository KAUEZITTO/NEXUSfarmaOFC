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
import { Boxes, Printer } from "lucide-react";

// Mock data for a single order
const orderData = {
  id: "ORD001",
  unit: "UBS Centro",
  date: "20 de Maio de 2024",
  recipient: "Enfermeira Chefe Ana",
  items: {
    medicines: [
      { name: "Dipirona 500mg", quantity: 50 },
      { name: "Paracetamol 750mg", quantity: 100 },
    ],
    technical_material: [
      { name: "Seringa 10ml", quantity: 200 },
      { name: "Luva de Procedimento (M)", quantity: 2 },
    ],
    odontological_items: [{ name: "Resina Composta Z350", quantity: 5 }],
    laboratory_items: [],
  },
};

const CategoryTitle = ({ children }: { children: React.ReactNode }) => (
  <TableRow>
    <TableCell colSpan={2} className="font-bold text-lg bg-muted">
      {children}
    </TableCell>
  </TableRow>
);

export default function ReceiptPage({ params }: { params: { id: string } }) {
  // In a real app, you would fetch order data based on params.id
  // const order = await fetchOrder(params.id);

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white text-black">
      <header className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {/* Placeholder for App Logo */}
          <Boxes className="h-10 w-10 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold">EstoqueLink</h1>
            <p className="text-sm">Termo de Recebimento</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            {/* Placeholder for CAF Logo */}
            <p className="font-bold">CAF LOGO</p>
          </div>
          <div>
            {/* Placeholder for Municipality Logo */}
            <p className="font-bold">MUNICIPALITY LOGO</p>
          </div>
        </div>
      </header>
      <Separator className="my-4 bg-gray-400" />
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
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
      <div className="mb-8">
        <p className="font-bold">Recebido por (Paciente/Responsável):</p>
        <p>{orderData.recipient}</p>
      </div>

      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80%]">Item</TableHead>
            <TableHead className="text-right">Quantidade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderData.items.medicines.length > 0 && (
            <>
              <CategoryTitle>Medicamentos</CategoryTitle>
              {orderData.items.medicines.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </>
          )}
          {orderData.items.technical_material.length > 0 && (
            <>
              <CategoryTitle>Material Técnico</CategoryTitle>
              {orderData.items.technical_material.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </>
          )}
          {orderData.items.odontological_items.length > 0 && (
            <>
              <CategoryTitle>Itens Odontológicos</CategoryTitle>
              {orderData.items.odontological_items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </>
          )}
          {orderData.items.laboratory_items.length > 0 && (
            <>
              <CategoryTitle>Itens de Laboratório</CategoryTitle>
              {orderData.items.laboratory_items.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
      </Table>
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
