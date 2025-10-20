
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
import { SpeedInsights } from "@vercel/speed-insights/next"

const CURRENT_VERSION = '3.5.0';

const changelog = [
    { version: '3.5.0', changes: ['Dashboard agora exibe lembretes de retorno para pacientes próximos.', 'Adicionada seção "Atividades Recentes" ao dashboard com as últimas dispensações e remessas.', 'Campo "Nome de Exibição" adicionado ao formulário de cadastro de novos usuários.', 'Implementado banner de consentimento de cookies para conformidade e transparência.'] },
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
            <SpeedInsights />
          </TourGuideWrapper>
        </SidebarProvider>
  );
}

    
