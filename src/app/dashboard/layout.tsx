'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuideWrapper, UpdateDialog } from '@/components/dashboard/tour-guide';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeToggle } from '@/components/ThemeToggle';
import { HospitalNav } from '@/components/dashboard/hospital/hospital-nav';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/page-loader';
import { combinedNavItems } from '@/components/dashboard/combined-nav';


const CURRENT_VERSION = '3.6.3';

const changelog = [
    { version: '3.6.3', changes: ['Correção da estrutura do projeto e consistência geral da versão.'] },
    { version: '3.6.2', changes: ['Refatoração completa da arquitetura de Server Actions e módulos de dados para resolver múltiplos erros de build (`Module not found` e `use server` em Client Components), garantindo a estabilidade definitiva da aplicação.'] },
    { version: '3.6.1', changes: ['Corrigido bug crítico nos recibos onde a data de validade de alguns itens não era exibida corretamente.'] },
    { version: '3.6.0', changes: ['Implementado campo de observações na tela de dispensação e no recibo final para registrar informações adicionais.', 'Corrigidos múltiplos bugs críticos de cache que causavam inconsistências de dados, garantindo que o dashboard e as listas de pacientes/unidades estejam sempre sincronizados em tempo real.', 'Resolvidos problemas de configuração do servidor que impediam o cadastro de novos usuários e a exclusão de pacientes.', 'Aprimorado o tour guiado para ser interativo e navegar entre as páginas.', 'Ajustado o design e as informações do recibo de dispensação (Termo de Entrega) para incluir dados do paciente e gerar duas vias.'] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const isHospitalUser = session?.user?.location === 'Hospital';
    const isCoordinator = session?.user?.subRole === 'Coordenador';

    useEffect(() => {
        if (status === 'authenticated' && !isCoordinator) {
             if (pathname === '/dashboard/select-location') {
                 router.replace('/dashboard');
                 return;
             }
            if (isHospitalUser && !pathname.startsWith('/dashboard/hospital') && !['/dashboard/inventory', '/dashboard/settings', '/dashboard/about'].includes(pathname)) {
                router.replace('/dashboard/hospital');
            } else if (!isHospitalUser && pathname.startsWith('/dashboard/hospital')) {
                router.replace('/dashboard');
            }
        }
    }, [status, isHospitalUser, isCoordinator, pathname, router]);

    if (status === 'loading' || (status === 'authenticated' && !isCoordinator && (
        (isHospitalUser && !pathname.startsWith('/dashboard/hospital') && !['/dashboard/inventory', '/dashboard/settings', '/dashboard/about'].includes(pathname)) ||
        (!isHospitalUser && pathname.startsWith('/dashboard/hospital'))
    ))) {
        return <PageLoader isLoading={true} />;
    }

  const renderNav = () => {
    if (isCoordinator) {
        return <DashboardNav navItems={combinedNavItems} />;
    }
    if (isHospitalUser) {
        return <HospitalNav />;
    }
    return <DashboardNav />;
  }

  return (
        <SidebarProvider>
          <TourGuideWrapper>
            <div className="grid min-h-screen w-full md:grid-cols-[var(--sidebar-width)_1fr] peer-data-[state=collapsed]:md:grid-cols-[var(--sidebar-width-icon)_1fr] transition-[grid-template-columns] duration-300 ease-in-out">
              <Sidebar className="bg-primary text-primary-foreground">
                  <SidebarHeader className="border-b border-primary-foreground/20">
                      <Link href="/dashboard" className="flex items-center gap-2 font-semibold" data-tour-id="step-logo">
                          <Logo />
                      </Link>
                  </SidebarHeader>
                  <SidebarContent className="p-2">
                      {renderNav()}
                  </SidebarContent>
                  <div className="mt-auto flex flex-col items-center gap-2 border-t border-primary-foreground/20 p-4">
                        <ThemeToggle />
                  </div>
              </Sidebar>
              <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 shadow-sm">
                  <SidebarTrigger className="md:hidden" />
                  <div className="w-full flex-1">
                    {/* Can add a search bar here if needed */}
                  </div>
                  <UserNav />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
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
