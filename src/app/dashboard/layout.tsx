
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuideWrapper, UpdateDialog } from '@/components/dashboard/tour-guide';
import BirthdayBalloons from '@/components/dashboard/birthday-balloons';
import { updateUserLastSeen } from '@/lib/actions';

const CURRENT_VERSION = '3.5.0';

const changelog = [
    { version: '3.5.0', changes: ['Correção definitiva da impressão de recibos, padronizando a renderização no servidor.', 'Resolução do bug de status online/offline inconsistente.', 'Adicionada barra de pesquisa e corrigido a exibição de status na página de pacientes.', 'Adicionada a categoria "Tiras de Glicemia/Lancetas" e corrigido o filtro de produtos no atendimento.'] },
    { version: '3.4.0', changes: ['Desabilitado o cache de dados no servidor (`unstable_noStore`) para resolver erros de dados desatualizados e garantir a consistência em tempo real.'] },
    { version: '3.0.7', changes: ['Implementada correção arquitetural definitiva na página de Inventário, consolidando toda a lógica em um único componente cliente para resolver o erro de build `Failed to collect page data`.'] },
    { version: '2.9.1', changes: ['Correção arquitetural definitiva para o erro de build `Failed to collect page data` na página de Inventário, utilizando `router.refresh()` para revalidação de dados.'] },
    { version: '2.9.0', changes: ['Refatoração da página de Inventário para isolar componentes Server/Client, corrigindo erro de build.'] },
    { version: '2.4.2', changes: ['Removido callback `jwt` desnecessário que causava o erro `REQUEST_HEADER_TOO_LARGE` mesmo com a estratégia de sessão `database`.'] },
    { version: '2.4.1', changes: ['Implementada correção definitiva do erro "REQUEST_HEADER_TOO_LARGE" utilizando a estratégia de sessão no banco de dados, o que minimiza o tamanho do cookie de autenticação e garante a estabilidade do sistema.'] },
];

function UserActivityTracker() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const updateActivity = async () => {
        await updateUserLastSeen(session.user!.id);
        // Força a revalidação dos dados da página atual
        router.refresh(); 
      };
      
      updateActivity(); // Executa imediatamente ao carregar
      
      // Continua a atualizar a atividade e os dados da página a cada 30 segundos
      const intervalId = setInterval(updateActivity, 30000); 
      
      return () => clearInterval(intervalId);
    }
  }, [status, session, router]);

  return null; // Este componente não renderiza nada
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <SidebarProvider>
          <TourGuideWrapper>
            <UserActivityTracker />
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

    