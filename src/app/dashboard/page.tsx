
import { getCurrentUser, logout } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Esta verificação é uma camada extra de segurança. 
  // O middleware já deve ter protegido esta rota.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl">Bem-vindo ao Dashboard!</CardTitle>
                <CardDescription>
                    Sua sessão está ativa.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>
                    Seu email é: <span className="font-semibold text-primary">{user.email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Este conteúdo só pode ser visto por usuários autenticados.
                </p>
            </CardContent>
            <CardFooter>
                 <form action={logout} className="w-full">
                    <Button type="submit" variant="outline" className="w-full">
                        Sair
                    </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
}
