
import React from 'react';
import Link from 'next/link';

import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuideWrapper, UpdateDialog } from '@/components/dashboard/tour-guide';
import BirthdayBalloons from '@/components/dashboard/birthday-balloons';

const CURRENT_VERSION = '3.3.0';

const changelog = [
    { version: '3.3.0', changes: ['Modernização completa da interface com nova paleta de cores (azul, laranja) e identidade visual.', 'Ajustes de layout e modernização da página inicial e rodapé.'] },
    { version: '3.2.2', changes: ['Correção arquitetural definitiva para o carregamento de dados em páginas dinâmicas, resolvendo bugs de unidades e pacientes não encontrados.', 'Implementada a funcionalidade de exclusão de pedidos (com estorno de estoque) e de unidades.', 'Melhorado o cadastro de pacientes com controle de laudo de insulina, cálculo de dispensação e novas demandas.'] },
    { version: '3.2.1', changes: ['Corrigido o problema de cache de dados que impedia a exibição de informações recém-cadastradas, garantindo que os dados sejam sempre atualizados em tempo real.'] },
    { version: '3.2.0', changes: ['Refatorada a arquitetura de busca de dados em todas as páginas de listagem para resolver definitivamente o problema de "dados fantasmas", garantindo que as informações sejam atualizadas em tempo real após qualquer cadastro ou edição.'] },
    { version: '3.1.3', changes: ['Resolvido problema de atualização de dados em tempo real. As listas (inventário, pacientes, etc.) agora recarregam automaticamente após um novo cadastro ou edição.'] },
    { version: '3.1.2', changes: ['Correção de erro de sintaxe na diretiva `use server` que impedia o build da aplicação.'] },
    { version: '3.1.1', changes: ['Correção definitiva do erro de build `Failed to collect page data` ao isolar a lógica de importação do `knowledge-base.json` para o arquivo `data.ts`, garantindo a estabilidade da compilação.'] },
    { version: '3.1.0', changes: ['Refatoração completa do fluxo de autenticação para resolver o erro "Credenciais Inválidas" e estabilizar o login.', 'Adicionado botão de visibilidade de senha na tela de login.'] },
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
            
            <UpdateDialog currentVersion={CURRENT_VERSION} changelog={changelog.slice(0,1)} />

          </TourGuideWrapper>
        </SidebarProvider>
  );
}
