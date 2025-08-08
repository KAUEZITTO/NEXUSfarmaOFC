import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, PlusCircle } from "lucide-react";

export default function NewOrderPage() {
  return (
    <form className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            Criar Nova Remessa
          </h1>
          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            <Button variant="outline" size="sm">
              Descartar
            </Button>
            <Button size="sm">Salvar Remessa</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Remessa</CardTitle>
                <CardDescription>
                  Selecione a unidade de destino e adicione os produtos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="unit">Unidade de Destino</Label>
                    <Select>
                      <SelectTrigger id="unit" aria-label="Selecione a unidade">
                        <SelectValue placeholder="Selecione a unidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unit1">UBS Centro</SelectItem>
                        <SelectItem value="unit2">Hospital Municipal</SelectItem>
                        <SelectItem value="unit3">CEO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Itens da Remessa</CardTitle>
                 <CardDescription>
                  Adicione os produtos e quantidades para esta remessa.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {/* Item 1 */}
                  <div className="grid grid-cols-[1fr_100px_auto] items-center gap-4">
                    <Select>
                       <SelectTrigger id="product1" aria-label="Selecione o produto">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prod1">Dipirona 500mg (Estoque: 150)</SelectItem>
                        <SelectItem value="prod2">Seringa 10ml (Estoque: 500)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Qtd." defaultValue="10" />
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Item 2 */}
                  <div className="grid grid-cols-[1fr_100px_auto] items-center gap-4">
                    <Select>
                       <SelectTrigger id="product2" aria-label="Selecione o produto">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prod1">Dipirona 500mg (Estoque: 150)</SelectItem>
                        <SelectItem value="prod2">Seringa 10ml (Estoque: 500)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Qtd." defaultValue="50" />
                    <Button variant="ghost" size="icon">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar outro item
                  </Button>
                 </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Adicione qualquer observação sobre a remessa..." />
              </CardContent>
            </Card>
          </div>
        </div>
         <div className="flex items-center justify-center gap-2 md:hidden">
            <Button variant="outline" size="sm">
              Descartar
            </Button>
            <Button size="sm">Salvar Remessa</Button>
          </div>
      </div>
    </form>
  )
}
