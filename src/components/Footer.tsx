import Image from 'next/image';
import Link from 'next/link';
import { Logo } from './logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Logo />
            <p className="text-xs text-muted-foreground max-w-xs">
              Sistema integrado para controle, rastreabilidade e eficiência na distribuição de medicamentos.
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Apoio Institucional</span>
              <div className="flex items-center justify-center gap-6">
                <Link href="https://prefeituradeigarapeacu.pa.gov.br/" target="_blank" rel="noopener noreferrer">
                  <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={100} height={50} className="object-contain" data-ai-hint="city hall government" />
                </Link>
                <Image src="/CAF.png" alt="Logo CAF" width={80} height={50} className="object-contain" data-ai-hint="pharmacy cross" />
              </div>
          </div>
          
          <div className="flex flex-col items-center md:items-end text-xs text-muted-foreground">
              <p>&copy; {currentYear} NexusFarma. Todos os direitos reservados.</p>
              <p>Desenvolvido por Kauê Moreira.</p>
              <p className="font-semibold">Prefeitura de Igarapé-Açu</p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>Este sistema é uma iniciativa da Secretaria Municipal de Saúde para modernizar a gestão farmacêutica.</p>
        </div>
      </div>
    </footer>
  );
}
