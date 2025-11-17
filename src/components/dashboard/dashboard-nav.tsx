'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Building2,
  BarChart2,
  Info,
  Shield,
  Settings
} from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import { useSidebar } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import type { User } from '@/lib/types';

export const defaultNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios' },
  { href: '/dashboard/user-management', icon: Shield, label: 'Usuários', adminOnly: true },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre' },
];

export function DashboardNav({ isMobile = false, navItems = defaultNavItems, userAccessLevel }: { isMobile?: boolean; navItems?: any[]; userAccessLevel?: string }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
 
  return (
     <SidebarMenu>
        {navItems.map(({ href, icon: Icon, label, adminOnly, isSeparator }, index) => {
            if (isSeparator) {
                return (
                    <div key={`sep-${index}`} className="px-3 py-2">
                        <Separator className="bg-primary-foreground/20" />
                        <span className="text-xs font-bold uppercase text-primary-foreground/50 mt-2 block">{label}</span>
                    </div>
                )
            }

            if (adminOnly && userAccessLevel !== 'Admin') {
                return null;
            }

            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

            return (
                <SidebarMenuItem key={label}>
                    <SidebarMenuButton 
                        asChild
                        isActive={isActive}
                        onClick={() => {
                            if (isMobile) {
                                setOpenMobile(false)
                            }
                        }}
                        tooltip={label}
                        className={`transition-colors duration-200 hover:bg-secondary hover:text-secondary-foreground hover:scale-105`}
                    >
                      <Link href={href}>
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )
        })}
    </SidebarMenu>
  );
}
