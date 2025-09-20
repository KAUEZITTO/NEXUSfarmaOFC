
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Info, LifeBuoy, Lightbulb, Coffee, GitBranch } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold">Sobre o NexusFarma</h1>
        <p className="text-muted-foreground mt-2">Informações sobre o sistema, parcerias e suporte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6" />
              O Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Gestão para o CAF
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Este sistema foi desenvolvido para a gestão integrada do Centro de 
                  Abastecimento Farmacêutico (CAF), otimizando o controle de estoque,
                  pedidos e distribuição para as unidades de saúde do município.
                </p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Versão do Sistema
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  NexusFarma v0.9.3 (Beta)
                </p>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6" />
              Suporte e Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
               <div>
                <h3 className="font-semibold">
                  Suporte Técnico
                  </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Para suporte técnico ou dúvidas, entre em contato através do e-mail: <a href="mailto:nexusfarmaofc@gmail.com" className="text-primary hover:underline">nexusfarmaofc@gmail.com</a>.
                </p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Sugestões Futuras
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Tem ideias para melhorar o NexusFarma? Envie suas sugestões para
                  o mesmo e-mail do suporte. Estamos sempre abertos a novas propostas para evoluir o sistema!
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
