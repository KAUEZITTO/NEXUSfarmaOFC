import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, BarChart2, AlertTriangle, Package, Users } from "lucide-react";
import { MonthlyConsumptionChart } from "@/components/dashboard/monthly-consumption-chart";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Gere e visualize relatórios de dispensação, estoque e mais.
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório Completo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Dispensados (Mês)</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+5.2% em relação ao mês anterior</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Pacientes com mandado judicial/municipal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17</div>
            <p className="text-xs text-muted-foreground">12 baixo estoque, 5 perto do vencimento</p>
          </CardContent>
        </Card>
      </div>

       <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Consumo Mensal de Itens
            </CardTitle>
            <CardDescription>
              Visualize a quantidade de itens dispensados nos últimos 6 meses.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
             <MonthlyConsumptionChart />
          </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatórios Específicos</CardTitle>
          <CardDescription>
            Selecione um tipo de relatório para gerar um documento PDF.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Dispensação por Unidade
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Estoque Atual
          </Button>
           <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Produtos a Vencer
          </Button>
          <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Atendimento de Pacientes
          </Button>
           <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Entradas e Saídas
          </Button>
           <Button variant="outline" className="justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Relatório de Lotes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
