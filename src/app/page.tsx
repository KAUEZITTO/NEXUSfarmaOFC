
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package, Users, BarChart2, ShieldCheck, HeartPulse, Pill, ClipboardList, Stethoscope, ArrowRight, GitBranch, Share2, Truck, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';

const features = [
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: 'Estoque Inteligente',
    description: 'Gestão em tempo real de lotes e validades para evitar perdas e rupturas de estoque.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Cadastro de Pacientes',
    description: 'Histórico centralizado, acompanhamento de demandas judiciais e dispensações por paciente.',
  },
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: 'Remessas para Unidades',
    description: 'Crie e gerencie guias de remessa para abastecer as unidades de saúde da sua rede.',
  },
  {
    icon: <Pill className="h-8 w-8 text-primary" />,
    title: 'Dispensação Ágil',
    description: 'Registre a saída de itens para pacientes de forma rápida, segura e com geração de recibo.',
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-primary" />,
    title: 'Relatórios Estratégicos',
    description: 'Visualize dados consolidados de consumo, estoque e atendimentos para decisões informadas.',
  },
    {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Segurança e Rastreio',
    description: 'Rastreabilidade total de cada item, com controle de acesso por níveis de permissão.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
             <Link href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Recursos</Link>
             <Link href="#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">Como Funciona</Link>
             <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">Sobre</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/login">Acessar Sistema</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-gradient-to-b from-muted/30 via-background to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="space-y-4">
                   <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary dark:bg-primary/20">
                    Gestão Farmacêutica Inteligente
                  </div>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                    NexusFarma: A ponte para uma saúde pública eficiente.
                  </h1>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Otimize o controle, a dispensação e a rastreabilidade de medicamentos na sua rede de saúde. Mais controle para a gestão, mais cuidado para o cidadão.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                     <Link href="/login">Acessar o Painel <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold dark:bg-primary/20">Recursos Principais</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Tudo que você precisa em um só lugar</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  O NexusFarma foi desenhado para simplificar a complexa rotina do Centro de Abastecimento Farmacêutico (CAF), integrando todas as operações em uma plataforma robusta e intuitiva.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
              {features.map((feature) => (
                <div key={feature.title} className="relative group overflow-hidden rounded-lg border bg-card p-0.5 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                    <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/50 to-secondary/50 opacity-0 transition-opacity duration-500 group-hover:opacity-75" />
                    <Card className="relative h-full">
                        <CardHeader className="flex flex-col items-center text-center gap-4 pb-4">
                            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
                            {feature.icon}
                            </div>
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="space-y-2">
                      <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-semibold dark:bg-primary/20">Como Funciona</div>
                      <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Um Fluxo de Trabalho Simplificado</h2>
                      <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                          Organize sua operação em três passos simples e integrados.
                      </p>
                  </div>
              </div>
              <div className="mx-auto grid items-center gap-8 md:grid-cols-3 md:gap-12 mt-12">
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="bg-background p-6 rounded-full border shadow-sm">
                          <GitBranch className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">1. Cadastrar e Gerenciar</h3>
                      <p className="text-muted-foreground">Adicione produtos ao inventário, cadastre pacientes e configure as unidades de saúde que sua farmácia atende.</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="bg-background p-6 rounded-full border shadow-sm">
                          <Share2 className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">2. Distribuir e Dispensar</h3>
                      <p className="text-muted-foreground">Crie remessas para abastecer as unidades ou registre a dispensação de itens diretamente para os pacientes no balcão.</p>
                  </div>
                   <div className="flex flex-col items-center text-center gap-4">
                      <div className="bg-background p-6 rounded-full border shadow-sm">
                           <BarChart2 className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">3. Analisar e Otimizar</h3>
                      <p className="text-muted-foreground">Gere relatórios completos para entender o consumo, prever demandas, monitorar validades e otimizar todo o ciclo.</p>
                  </div>
              </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <Link href="https://www.instagram.com/prefeitura_iga" target="_blank" rel="noopener noreferrer" className="block group">
              <Image 
                src="/banner-prefeitura.png" 
                alt="Banner da Prefeitura de Igarapé-Açu - Siga nosso instagram @prefeitura_iga"
                width={1200}
                height={200}
                className="rounded-lg object-cover w-full transition-transform duration-300 group-hover:scale-[1.02]"
                data-ai-hint="city hall banner"
              />
            </Link>
          </div>
        </section>

      </main>
      <footer className="border-t bg-background py-8">
        <div className="container flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-muted-foreground font-semibold">Apoio Institucional</span>
                <div className="flex items-center justify-center gap-6 opacity-80">
                    <a href="https://prefeituradeigarapeacu.pa.gov.br/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-100">
                      <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={120} height={60} className="object-contain" data-ai-hint="city hall government" />
                    </a>
                    <Image src="/CAF.png" alt="Logo CAF" width={100} height={60} className="object-contain" data-ai-hint="pharmacy cross" />
                </div>
            </div>
            <div className="text-xs text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} NexusFarma. Todos os direitos reservados.</p>
                <p>Desenvolvido por Kauê Moreira para a Prefeitura de Igarapé-Açu.</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
