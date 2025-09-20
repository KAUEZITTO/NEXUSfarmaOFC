
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuide, TourProvider } from '@/components/dashboard/tour-guide';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';

const UPDATE_STORAGE_KEY = 'nexusfarma-last-seen-version';
const CURRENT_VERSION = '0.9.5';

const changelog = [
    { version: '0.9.5', changes: ['Adicionado pop-up de novidades da versão para manter os usuários informados sobre as atualizações.'] },
    { version: '0.9.4', changes: ['Correção de erros de build na Vercel relacionados à configuração do Next.js.'] },
    { version: '0.9.3', changes: ['Ajustes no rodapé da página inicial.'] },
    { version: '0.9.2', changes: ['Migração completa do sistema de arquivos para o banco de dados Vercel KV, permitindo persistência de dados online.', 'Remoção de arquivos de dados JSON locais.'] },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(UPDATE_STORAGE_KEY);
    if (lastSeenVersion !== CURRENT_VERSION) {
      setIsUpdateDialogOpen(true);
    }
  }, []);

  const handleCloseUpdateDialog = () => {
    localStorage.setItem(UPDATE_STORAGE_KEY, CURRENT_VERSION);
    setIsUpdateDialogOpen(false);
  }

  return (
    <SidebarProvider>
      <TourProvider>
        <div className="grid min-h-screen w-full md:grid-cols-[var(--sidebar-width)_1fr] peer-data-[state=collapsed]:md:grid-cols-[var(--sidebar-width-icon)_1fr] transition-[grid-template-columns] duration-300 ease-in-out">
          <Sidebar>
              <SidebarHeader>
                  <Link href="/dashboard" className="flex items-center gap-2 font-semibold" data-tour-id="step-logo">
                      <Logo />
                  </Link>
              </SidebarHeader>
              <SidebarContent>
                  <DashboardNav />
              </SidebarContent>
          </Sidebar>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
              <SidebarTrigger className="md:hidden" />
              <div className="w-full flex-1">
                {/* Can add a search bar here if needed */}
              </div>
              <UserNav />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
              {children}
            </main>
          </div>
        </div>
        <TourGuide />

        <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Novidades da Versão <Badge>{CURRENT_VERSION}</Badge>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Confira o que mudou na última atualização do sistema:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="text-sm text-muted-foreground space-y-3 max-h-60 overflow-y-auto pr-4">
                  {changelog.map(log => (
                      <div key={log.version}>
                          <h4 className="font-semibold text-foreground">Versão {log.version}</h4>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                              {log.changes.map((change, index) => (
                                  <li key={index}>{change}</li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
              <AlertDialogFooter>
                <AlertDialogAction onClick={handleCloseUpdateDialog}>Entendido</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </TourProvider>
    </SidebarProvider>
  );
}
