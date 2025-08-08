
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Info, LifeBuoy, Lightbulb, Coffee } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold">Sobre o NexusFarma</h1>
        <p className="text-muted-foreground mt-2">Informações sobre o sistema, parcerias e suporte.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6" />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-6 w-6 text-yellow-600" />
            Integração Cultural: Café de Igarapé-Açu
          </CardTitle>
          <CardDescription>Valorizando a produção e a cultura local.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-6">
            <Image 
                src="https://placehold.co/200x200.png"
                alt="Logo Café de Igarapé-Açu"
                width={150}
                height={150}
                data-ai-hint="coffee bean logo"
                className="rounded-lg shadow-md"
            />
            <p className="text-muted-foreground flex-1">
              O NexusFarma se orgulha de apoiar e valorizar a cultura de Igarapé-Açu. A integração com o "Café de Igarapé-Açu" simboliza nosso compromisso com o desenvolvimento local, unindo a inovação em saúde com a tradição e o sabor que são a marca da nossa terra. Esta parceria reflete a força da nossa comunidade.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
