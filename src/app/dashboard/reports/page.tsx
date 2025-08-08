import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileSearch } from "lucide-react";

export default function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios Mensais</CardTitle>
        <CardDescription>
          Gere e visualize relatórios de dispensação, estoque e mais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg">
          <FileSearch className="h-16 w-16 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">
            Página de Relatórios em Construção
          </h2>
          <p className="mt-2 text-muted-foreground">
            Em breve, você poderá gerar relatórios detalhados aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
