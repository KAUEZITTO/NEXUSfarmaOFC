import Image from 'next/image';
import { Separator } from './ui/separator';
import { Logo } from './logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
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
              <p>&copy; {currentYear} NexusFarma. Todos os direitos reservados.</p>
              <p>Desenvolvido por Kauê Moreira para a Prefeitura de Igarapé-Açu.</p>
          </div>
      </div>
    </footer>
  );
}
