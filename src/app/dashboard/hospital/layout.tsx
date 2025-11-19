'use server';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { UserNav } from '@/components/dashboard/user-nav';
import { Logo } from '@/components/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HospitalNav } from '@/components/dashboard/hospital/hospital-nav';
import { getCurrentUser } from '@/lib/auth';
import { PageLoader } from '@/components/ui/page-loader';
import DashboardHeader from '@/components/dashboard/dashboard-header';

export default async function HospitalDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        return <PageLoader isLoading={true} />;
    }

    return (
        <Suspense fallback={<PageLoader isLoading={true} />}>
            <SidebarProvider>
                <div className="grid min-h-screen w-full md:grid-cols-[var(--sidebar-width)_1fr] peer-data-[state=collapsed]:md:grid-cols-[var(--sidebar-width-icon)_1fr] transition-[grid-template-columns] duration-300 ease-in-out">
                    <Sidebar className="bg-primary text-primary-foreground hidden md:flex">
                        <SidebarHeader className="border-b border-primary-foreground/20">
                            <Link href="/dashboard/hospital" className="flex items-center gap-2 font-semibold">
                                <Logo />
                            </Link>
                        </SidebarHeader>
                        <SidebarContent className="p-2">
                           <HospitalNav />
                        </SidebarContent>
                        <div className="mt-auto flex flex-col items-center gap-2 border-t border-primary-foreground/20 p-4">
                            <ThemeToggle />
                        </div>
                    </Sidebar>
                    <div className="flex flex-col">
                        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 shadow-sm">
                            <SidebarTrigger className="md:hidden" />
                            <div className="md:hidden">
                                <Link href="/dashboard/hospital" className="flex items-center gap-2 font-semibold">
                                    <Logo />
                                </Link>
                            </div>
                            <div className="w-full flex-1" />
                            <UserNav user={user} />
                        </header>
                        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/40">
                             {user && <DashboardHeader userName={user.name} />}
                            {children}
                        </main>
                    </div>
                </div>
            </SidebarProvider>
        </Suspense>
    );
}
