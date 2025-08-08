
'use client';

import React from 'react';
import Link from 'next/link';

import { UserNav } from '@/components/dashboard/user-nav';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { TourGuide, TourProvider } from '@/components/dashboard/tour-guide';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <TourProvider>
      <SidebarProvider>
        <TourGuide />
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
      </SidebarProvider>
    </TourProvider>
  );
}
