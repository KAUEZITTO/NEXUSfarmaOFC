'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative w-full py-24 md:py-40 lg:py-48 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"></div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center space-y-6 text-center"
        >
          <div className="space-y-4">
             <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Gestão Farmacêutica Inteligente
              </div>
              <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                NexusFarma: A ponte para uma saúde pública eficiente.
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Otimize o controle, a dispensação e a rastreabilidade de medicamentos e insumos na sua rede de saúde. Mais controle para a gestão, mais cuidado para o cidadão.
              </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button asChild size="lg" className="rounded-full shadow-lg transition-transform hover:scale-105">
              <Link href="/login">
                Acessar Painel <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <Link href="#features">Conhecer Recursos</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
