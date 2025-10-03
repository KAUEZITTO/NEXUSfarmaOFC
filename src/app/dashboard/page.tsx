
'use client';

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // O middleware já deve ter redirecionado, mas como segurança extra.
    return <p>Acesso negado. Redirecionando para login...</p>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl">Bem-vindo ao Dashboard!</CardTitle>
                <CardDescription>
                    Sua sessão está ativa com NextAuth.js.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p>
                    Seu email é: <span className="font-semibold text-primary">{session?.user?.email}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    Este conteúdo só pode ser visto por usuários autenticados.
                </p>
            </CardContent>
            <CardFooter>
                 <Button onClick={() => signOut()} variant="outline" className="w-full">
                    Sair
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
