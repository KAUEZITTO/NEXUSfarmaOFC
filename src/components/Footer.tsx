
import { Separator } from './ui/separator';
import { Logo } from './logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-32 h-auto" />
          </div>
          <div className="text-center md:text-right">
            <p className="font-semibold">Prefeitura Municipal – Secretaria de Saúde</p>
            <p className="text-sm opacity-80">
              Gestão e tecnologia a serviço do cidadão.
            </p>
          </div>
        </div>
        <Separator className="my-6 bg-primary-foreground/20" />
        <div className="text-center text-sm opacity-70">
          <p>&copy; {currentYear} NexusFarma. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
