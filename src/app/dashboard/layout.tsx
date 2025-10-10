
import React from 'react';
import Link from 'next/link';

import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuideWrapper, UpdateDialog } from '@/components/dashboard/tour-guide';
import BirthdayBalloons from '@/components/dashboard/birthday-balloons';

const CURRENT_VERSION = '3.1.1';

const changelog = [
    { version: '3.1.1', changes: ['Implementada a abordagem "get-or-create" para garantir que um perfil de usuário seja sempre encontrado ou criado após a autenticação bem-sucedida no Firebase, resolvendo definitivamente o erro de "Credenciais Inválidas".'] },
    { version: '3.1.0', changes: ['Refatoração completa do fluxo de autenticação para resolver o erro "Credenciais Inválidas" e estabilizar o login.', 'Adicionado botão de visibilidade de senha na tela de login.'] },
    { version: '3.0.9', changes: ['Corrigido fluxo de autenticação do servidor Firebase para resolver falhas de login.'] },
    { version: '3.0.8', changes: ['Resolvido problema de carregamento infinito no login através da refatoração da arquitetura de autenticação.'] },
    { version: '3.0.7', changes: ['Implementada correção arquitetural definitiva na página de Inventário, consolidando toda a lógica em um único componente cliente para resolver o erro de build `Failed to collect page data`.'] },
    { version: '2.9.1', changes: ['Correção arquitetural definitiva para o erro de build `Failed to collect page data` na página de Inventário, utilizando `router.refresh()` para revalidação de dados.'] },
    { version: '2.9.0', changes: ['Refatoração da página de Inventário para isolar componentes Server/Client, corrigindo erro de build.'] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <SidebarProvider>
          <TourGuideWrapper>
            <BirthdayBalloons />
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
            
            <UpdateDialog currentVersion={CURRENT_VERSION} changelog={changelog} />

          </TourGuideWrapper>
        </SidebarProvider>
  );
}
