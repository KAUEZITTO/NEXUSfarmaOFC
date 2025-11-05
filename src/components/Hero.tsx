
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight, Box, Syringe, TestTube2 } from 'lucide-react';
import { motion } from 'framer-motion';

const floatingIcons = [
  { icon: <Syringe className="text-secondary" />, top: '15%', left: '10%' },
  { icon: <Box className="text-accent" />, top: '30%', left: '85%' },
  { icon: <TestTube2 className="text-secondary" />, top: '70%', left: '5%' },
  { icon: <Syringe className="text-accent opacity-50" />, top: '80%', left: '90%' },
];

export function Hero() {
  return (
    <section className="relative w-full py-24 md:py-40 lg:py-48 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background"></div>
      
      {/* Floating Icons */}
      {floatingIcons.map((item, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{ top: item.top, left: item.left }}
          animate={{
            y: [0, -10, 0, 10, 0],
            rotate: [0, 5, 0, -5, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 8,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        >
          {item.icon}
        </motion.div>
      ))}

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center space-y-6 text-center"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Gestão Farmacêutica Inteligente
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              Sistema integrado para controle, rastreabilidade e eficiência na
              distribuição de medicamentos.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row">
            <Button asChild size="lg" className="rounded-full shadow-lg transition-transform hover:scale-105">
              <Link href="/login">
                Acessar Sistema <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full shadow-lg transition-transform hover:scale-105"
            >
              <Link href="#features">Saiba Mais</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
