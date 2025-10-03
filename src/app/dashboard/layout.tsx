
import React from 'react';
import Link from 'next/link';

import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuideWrapper, UpdateDialog } from '@/components/dashboard/tour-guide';

const CURRENT_VERSION = '2.0.2';

const changelog = [
    { version: '2.0.2', changes: ['Otimizado o fluxo de login para garantir o redirecionamento imediato e correto para o dashboard após a autenticação, eliminando a necessidade de recarregar a página.'] },
    { version: '2.0.1', changes: ['Correção de erros críticos de importação nas Server Actions que impediam o funcionamento de cadastros.', 'Resolvido erro que impedia o registro de novos usuários.'] },
    { version: '2.0.0', changes: ['Lançamento da versão estável "Definitivo 2". Refatoração completa da arquitetura de acesso a dados e autenticação para garantir estabilidade e corrigir múltiplos erros de build.'] },
    { version: '1.3.0', changes: ['Refatoração completa do sistema de autenticação e acesso a dados para resolver definitivamente o erro de build `Failed to collect page data`, garantindo a estabilidade da aplicação.'] },
    { version: '1.2.1', changes: ['Corrigido o redirecionamento após o login.', 'Substituída a animação de carregamento por um indicador mais claro e com melhor contraste.'] },
    { version: '1.2.0', changes: ['Correção de bugs 20: Refatoração completa do sistema de autenticação e acesso a dados para resolver definitivamente o erro de build `Failed to collect page data`, garantindo a estabilidade da aplicação.'] },
    { version: '1.1.4', changes: ['Refatoração da função `getCurrentUser` para remover a diretiva de Server Action, resolvendo definitivamente o erro de build `Failed to collect page data`.'] },
    { version: '1.1.3', changes: ['Remoção definitiva do `cache` do React da função `getCurrentUser`, resolvendo o erro de build `Failed to collect page data`.'] },
    { version: '1.1.2', changes: ['Correção de bugs 16: Refatorada a função `getCurrentUser` para remover o `cache` do React, evitando que o processo de build do Next.js a analise e cause erros.'] },
    { version: '1.1.1', changes: ['Correção de bugs 15: Correção final do erro de build `Failed to collect page data` ao forçar a renderização dinâmica da rota de API do usuário.'] },
    { version: '1.1.0', changes: ['O sistema agora é considerado estável e saiu da fase Beta.', 'Atualizadas dependências internas para melhorar performance e segurança.'] },
    { version: '1.0.2', changes: ['Correção de erro que impedia a geração de etiquetas de prateleira.'] },
    { version: '1.0.1', changes: ['Correção de erro de conexão com o banco de dados no ambiente de desenvolvimento.'] },
    { version: '1.0.0', changes: ['Lançamento do sistema de Cargos e Permissões (Admin/Usuário).', 'Adicionada tela de Gerenciamento de Usuários para Admins.', 'Reinicialização completa do banco de dados para o lançamento.'] },
    { version: '0.9.5', changes: ['Adicionado pop-up de novidades da versão para manter os usuários informados sobre as atualizações.'] },
    { version: '0.9.4', changes: ['Correção de erros de build na Vercel relacionados à configuração do Next.js.'] },
    { version: '0.9.3', changes: ['Ajustes no rodapé da página inicial.'] },
    { version: '0.9.2', changes: ['Migração completa do sistema de arquivos para o banco de dados Vercel KV, permitindo persistência de dados online.', 'Remoção de arquivos de dados JSON locais.'] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Com NextAuth, a verificação de sessão é feita no middleware
  // e os dados do usuário são acessados via `useSession` nos componentes cliente.
  // Não precisamos mais do `getCurrentUser` aqui.

  return (
        <SidebarProvider>
          <TourGuideWrapper>
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
