
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  Settings,
  ShoppingCart,
  Users,
  Building2,
  FileText,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/dashboard/user-nav';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Logo } from '@/components/logo';
import { PageLoader } from '@/components/ui/page-loader';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { navItems } from '@/components/dashboard/dashboard-nav';


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url: string) => {
      // Avoid triggering loader for the same page or external links
      if (url !== window.location.pathname) {
        setLoading(true);
      }
    };

    const handleComplete = () => {
        setLoading(false);
    };

    // We can't use Next.js App Router events directly, so we'll simulate it.
    // This will trigger on path changes.
    setLoading(false); // Make sure to turn it off when the new page is mounted.

  }, [pathname]);
  
   useEffect(() => {
    const navLinks = document.querySelectorAll('a[href^="/dashboard"]');

    const handleClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      if (target.pathname !== pathname) {
        setLoading(true);
      }
    };

    navLinks.forEach(link => link.addEventListener('click', handleClick as EventListener));

    return () => {
      navLinks.forEach(link => link.removeEventListener('click', handleClick as EventListener));
    };
  }, [pathname]);


  return (
    <SidebarProvider>
      <PageLoader isLoading={loading} />
      <div className="grid min-h-screen w-full">
         <Sidebar>
            <SidebarHeader>
                <Link href="/dashboard">
                    <Logo />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <DashboardNav />
            </SidebarContent>
        </Sidebar>
        <div className="flex flex-col peer-data-[collapsible=icon]:pl-[var(--sidebar-width-icon)] peer-data-[state=expanded]:pl-[var(--sidebar-width)] transition-[padding] duration-200">
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
  );
}
