'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  Building2,
  BarChart2,
  Info,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import { useSidebar } from '../ui/sidebar';


export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre' },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
 

  return (
     <SidebarMenu>
        {navItems.map(({ href, icon: Icon, label }) => (
            <SidebarMenuItem key={label}>
                <Link href={href} passHref legacyBehavior>
                    <SidebarMenuButton 
                        as="a"
                        isActive={pathname.startsWith(href) && href !== '/dashboard' || pathname === href}
                        onClick={() => {
                            if (isMobile) {
                                setOpenMobile(false)
                            }
                        }}
                        tooltip={label}
                    >
                        <Icon />
                        <span>{label}</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        ))}
    </SidebarMenu>
  );
}
