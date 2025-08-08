import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coffee, Info } from "lucide-react";

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
            <Coffee className="h-5 w-5 text-primary" />
            Café de Igarapé Açu
          </h2>
          <p className="mt-2 text-muted-foreground">
            Este sistema possui integração com informações do Café de Igarapé Açu,
            exibindo dados relevantes e promovendo a cultura local. O Café de
            Igarapé Açu é conhecido por sua qualidade excepcional e produção
            sustentável, sendo um orgulho para a nossa região.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Versão do Sistema</h2>
          <p className="mt-2 text-muted-foreground">
            NexusFarma v1.0.0
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Suporte</h2>
          <p className="mt-2 text-muted-foreground">
            Para suporte técnico, entre em contato com a equipe de TI da prefeitura.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
