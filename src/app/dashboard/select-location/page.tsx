'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Hospital, ArrowRight, UserCog } from 'lucide-react';
import Link from 'next/link';

export default function SelectLocationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Selecione um Ambiente</h1>
        <p className="text-muted-foreground mt-2">Escolha como você deseja navegar no sistema.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <Link href="/dashboard" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
            <CardHeader className="text-center p-8">
              <UserCog className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">Modo Coordenador</CardTitle>
              <CardDescription>
                Acesse a visão geral com dados consolidados e navegação completa por todos os setores.
              </CardDescription>
              <div className="flex items-center justify-center mt-4 text-primary font-semibold group-hover:gap-3 transition-all">
                Acessar Visão Geral <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/patients" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
            <CardHeader className="text-center p-8">
              <Building className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">Simular Acesso CAF</CardTitle>
              <CardDescription>
                Navegue pelo sistema como um usuário padrão do CAF, com acesso restrito às funções e dados do setor.
              </CardDescription>
              <div className="flex items-center justify-center mt-4 text-primary font-semibold group-hover:gap-3 transition-all">
                Entrar no Ambiente CAF <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/dashboard/hospital" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:border-primary hover:-translate-y-2">
            <CardHeader className="text-center p-8">
              <Hospital className="mx-auto h-16 w-16 text-primary mb-4" />
              <CardTitle className="text-2xl">Simular Acesso Hospital</CardTitle>
              <CardDescription>
                Navegue como um usuário da Farmácia Hospitalar, com acesso ao painel e inventário específico do hospital.
              </CardDescription>
               <div className="flex items-center justify-center mt-4 text-primary font-semibold group-hover:gap-3 transition-all">
                Entrar no Ambiente Hospital <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
