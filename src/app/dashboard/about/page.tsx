import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Info, LifeBuoy, Lightbulb } from "lucide-react";

export default function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-6 w-6" />
          Sobre o NexusFarma
        </CardTitle>
        <CardDescription>
          Informações sobre o sistema e integrações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            CAF - Centro de Abastecimento Farmacêutico
          </h2>
          <p className="mt-2 text-muted-foreground">
            Este sistema foi desenvolvido para a gestão integrada do Centro de 
            Abastecimento Farmacêutico (CAF), otimizando o controle de estoque,
            pedidos e distribuição para as unidades de saúde do município.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Versão do Sistema</h2>
          <p className="mt-2 text-muted-foreground">
            NexusFarma v1.0.0
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-primary" />
            Suporte
            </h2>
          <p className="mt-2 text-muted-foreground">
            Para suporte técnico ou dúvidas, entre em contato através do e-mail: <a href="mailto:nexus.help@gmail.com" className="text-primary hover:underline">nexus.help@gmail.com</a>.
          </p>
        </div>
         <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Sugestões Futuras
          </h2>
          <p className="mt-2 text-muted-foreground">
            Tem ideias para melhorar o NexusFarma? Envie suas sugestões para
            o mesmo e-mail do suporte. Estamos sempre abertos a novas propostas para evoluir o sistema!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
