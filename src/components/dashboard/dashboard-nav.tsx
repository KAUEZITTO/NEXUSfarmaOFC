
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
} from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import { useSidebar } from '../ui/sidebar';
import { useSession } from 'next-auth/react';


export const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', tourId: 'step-dashboard' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos', tourId: 'step-orders' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário', tourId: 'step-inventory' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes', tourId: 'step-patients' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades', tourId: 'step-units' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios', tourId: 'step-reports' },
  { href: '/dashboard/user-management', icon: Shield, label: 'Usuários', adminOnly: true, tourId: 'step-users' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre', tourId: 'step-about' },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: session } = useSession();
 
  return (
     <SidebarMenu>
        {navItems.map(({ href, icon: Icon, label, tourId, adminOnly }) => {
            if (adminOnly && session?.user?.accessLevel !== 'Admin') {
                return null;
            }
            return (
                <SidebarMenuItem key={label} data-tour-id={tourId}>
                    <SidebarMenuButton 
                        asChild
                        isActive={pathname === href || (pathname.startsWith(href) && href !== '/dashboard')}
                        onClick={() => {
                            if (isMobile) {
                                setOpenMobile(false)
                            }
                        }}
                        tooltip={label}
                    >
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )
        })}
    </SidebarMenu>
  );
}
