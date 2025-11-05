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
} from 'lucide-react';
import { motion } from 'framer-motion';

const featuresData = [
  {
    icon: <Package className="h-10 w-10 text-primary" />,
    title: 'Controle de Estoque',
    description:
      'Gestão completa de lotes, validades e inventário em tempo real para evitar perdas.',
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Gestão de Pacientes',
    description:
      'Cadastro detalhado de pacientes e histórico completo de todas as dispensações realizadas.',
  },
  {
    icon: <ClipboardList className="h-10 w-10 text-primary" />,
    title: 'Dispensação e Remessas',
    description:
      'Registre a saída de itens para pacientes e gere guias de remessa para as unidades de saúde.',
  },
  {
    icon: <BarChart2 className="h-10 w-10 text-primary" />,
    title: 'Relatórios Gerenciais',
    description:
      'Dados consolidados sobre consumo, atendimentos e estoque para decisões estratégicas.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Segurança e Rastreabilidade',
    description:
      'Controle de acesso e rastreabilidade total de cada item, do recebimento à entrega final.',
  },
  {
    icon: <Building2 className="h-10 w-10 text-primary" />,
    title: 'Gestão de Unidades',
    description:
      'Cadastre e gerencie as informações das unidades de saúde (UBS, hospitais, etc).',
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
            O NexusFarma foi desenhado para simplificar a complexa rotina do Centro de Abastecimento Farmacêutico (CAF), integrando todas as operações em uma plataforma robusta e intuitiva.
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
