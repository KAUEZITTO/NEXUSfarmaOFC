import {
  Activity,
  ArrowUpRight,
  CircleUser,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  AlertTriangle,
  Package,
  Building2
} from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { OverviewChart } from "@/components/dashboard/overview-chart"


export default function Dashboard() {
  return (
    <div className="flex flex-col w-full">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Itens em Baixo Estoque
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground">
              Itens que precisam de reposição urgente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Próximos ao Vencimento
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">5</div>
            <p className="text-xs text-muted-foreground">
              Itens com vencimento nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos no Mês</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+120</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação ao mês passado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+5,231</div>
            <p className="text-xs text-muted-foreground">
              Total de unidades de produtos
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Níveis de Estoque por Categoria</CardTitle>
            <CardDescription>
              Distribuição de itens de estoque nas principais categorias.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Unidades Mais Atendidas</CardTitle>
            <CardDescription>
              Unidades que mais receberam itens este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Itens Recebidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">UBS Centro</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      Hospital
                    </div>
                  </TableCell>
                  <TableCell className="text-right">1,250</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">Laboratório Municipal</div>
                     <div className="hidden text-sm text-muted-foreground md:inline">
                      Laboratório
                    </div>
                  </TableCell>
                  <TableCell className="text-right">980</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                     <div className="font-medium">Hospital Regional</div>
                     <div className="hidden text-sm text-muted-foreground md:inline">
                      Hospital
                    </div>
                  </TableCell>
                  <TableCell className="text-right">750</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                     <div className="font-medium">UBS Bairro Novo</div>
                     <div className="hidden text-sm text-muted-foreground md:inline">
                      Posto de Saúde
                    </div>
                  </TableCell>
                  <TableCell className="text-right">620</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                     <div className="font-medium">CEO</div>
                     <div className="hidden text-sm text-muted-foreground md:inline">
                      Odontologia
                    </div>
                  </TableCell>
                  <TableCell className="text-right">450</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
