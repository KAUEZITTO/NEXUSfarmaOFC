'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Hospital, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SelectLocationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Selecione um Ambiente</h1>
        <p className="text-muted-foreground mt-2">Escolha qual sistema você deseja gerenciar nesta sessão.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <Link href="/dashboard/patients" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
            <CardHeader className="text-center p-8">
              <Building className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">Gestão CAF</CardTitle>
              <CardDescription>
                Acesse o painel central para gerenciar pacientes, inventário geral, pedidos das unidades e relatórios consolidados.
              </CardDescription>
              <div className="flex items-center justify-center mt-4 text-primary font-semibold group-hover:gap-3 transition-all">
                Acessar CAF <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/hospital" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
            <CardHeader className="text-center p-8">
              <Hospital className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">Farmácia Hospitalar</CardTitle>
              <CardDescription>
                Acesse o painel do hospital para gerenciar o estoque interno, dispensar para setores e pacientes internados, e gerar relatórios específicos.
              </CardDescription>
               <div className="flex items-center justify-center mt-4 text-primary font-semibold group-hover:gap-3 transition-all">
                Acessar Hospital <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
