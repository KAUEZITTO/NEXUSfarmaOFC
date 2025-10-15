
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package, Users, BarChart2, ShieldCheck, HeartPulse, Pill, ClipboardList, Stethoscope } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const features = [
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: 'Controle de Estoque Inteligente',
    description: 'Gestão completa de lotes, validades e inventário em tempo real para evitar perdas e rupturas.',
  },
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: 'Gestão de Pacientes',
    description: 'Cadastro detalhado de pacientes, histórico de dispensação e acompanhamento de mandados judiciais e municipais.',
  },
  {
    icon: <Pill className="h-8 w-8 text-primary" />,
    title: 'Dispensação e Remessas',
    description: 'Gere guias de remessa para unidades e registre a dispensação de itens para pacientes com agilidade.',
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Relatórios Gerenciais',
    description: 'Visualize dados consolidados sobre consumo, atendimentos e níveis de estoque para tomar decisões estratégicas.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Segurança e Rastreabilidade',
    description: 'Processos seguros com controle de acesso e rastreabilidade total de cada item, do recebimento à entrega.',
  },
    {
    icon: <HeartPulse className="h-8 w-8 text-primary" />,
    title: 'Cuidado Integrado',
    description: 'Vincule pacientes às suas unidades de saúde, garantindo um acompanhamento completo e contínuo.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sobre
             </Link>
            <Button asChild>
              <Link href="/login">Acessar Sistema</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-4">
                   <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    Gestão Farmacêutica Inteligente
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-foreground/80">
                    NexusFarma: A ponte para uma saúde pública eficiente.
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Otimize o controle, a dispensação e a rastreabilidade de medicamentos e insumos na sua rede de saúde. Mais controle para a gestão, mais cuidado para o cidadão.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                     <Link href="/login">Acessar o Painel</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                     <Link href="#features">Conhecer Recursos</Link>
                  </Button>
                </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold">Recursos Principais</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Tudo que você precisa em um só lugar</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  O NexusFarma foi desenhado para simplificar a complexa rotina do Centro de Abastecimento Farmacêutico (CAF), integrando todas as operações em uma plataforma robusta e intuitiva.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/50 hover:shadow-lg hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-center text-center gap-4 pb-4">
                    <div className="bg-primary/10 p-4 rounded-full">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-muted/40 py-8">
        <div className="container flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground font-semibold">Apoio Institucional</span>
                <div className="flex items-center justify-center gap-6">
                    <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={120} height={60} className="object-contain" data-ai-hint="city hall government" />
                    <Image src="/CAF.png" alt="Logo CAF" width={100} height={60} className="object-contain" data-ai-hint="pharmacy cross" />
                </div>
            </div>
            <div className="text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} NexusFarma. Todos os direitos reservados.</p>
                <p>Desenvolvido com ❤️ por Kauê Moreira para a Prefeitura de Igarapé-Açu.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
