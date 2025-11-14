'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart2,
  ClipboardList,
  Package,
  ShieldCheck,
  Building2,
  Users,
  Hospital,
  Tags,
} from 'lucide-react';
import { motion } from 'framer-motion';

const featuresData = [
  {
    icon: <Package className="h-10 w-10 text-primary" />,
    title: 'Controle de Estoque Inteligente',
    description:
      'Gestão completa de lotes, validades e inventário separado por setor (CAF e Hospital) em tempo real para evitar perdas.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Gestão de Pacientes (CAF)',
    description:
      'Cadastro detalhado de pacientes, demandas de cuidado contínuo e histórico completo de dispensações.',
  },
  {
    icon: <Hospital className="h-10 w-10 text-primary" />,
    title: 'Gestão Hospitalar Integrada',
    description:
      'Controle o estoque da farmácia hospitalar, dispense materiais para setores (UTI, Enfermaria) e gerencie pacientes internados.',
  },
  {
    icon: <ClipboardList className="h-10 w-10 text-primary" />,
    title: 'Dispensação e Remessas',
    description:
      'Registre a saída de itens para pacientes (CAF) e gere guias de remessa para abastecer as unidades de saúde.',
  },
   {
    icon: <Tags className="h-10 w-10 text-primary" />,
    title: 'Etiquetas Profissionais',
    description:
      'Gere etiquetas personalizadas com código de barras para qualquer item, com suporte para impressoras térmicas (rolo) e A4.',
  },
  {
    icon: <BarChart2 className="h-10 w-10 text-primary" />,
    title: 'Relatórios Gerenciais',
    description:
      'Dados consolidados sobre consumo, estoque e atendimentos para decisões estratégicas, com relatórios específicos por setor.',
  },
];

export function Features() {
  return (
    <section id="features" className="w-full py-20 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-semibold">
            Recursos Principais
          </div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            O NexusFarma foi desenhado para simplificar a complexa rotina da gestão farmacêutica, integrando as operações do CAF e do Hospital em uma plataforma robusta e intuitiva.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full rounded-2xl shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-2">
                <CardHeader className="flex flex-col items-center text-center gap-4 pb-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
