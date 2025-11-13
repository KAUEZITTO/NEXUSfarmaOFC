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
  Settings,
  Building,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';
import { useSidebar } from '../ui/sidebar';
import { useSession } from 'next-auth/react';
import { Separator } from '../ui/separator';

export const defaultNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard', tourId: 'step-dashboard' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos', tourId: 'step-orders' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário', tourId: 'step-inventory' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes', tourId: 'step-patients' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades', tourId: 'step-units' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios', tourId: 'step-reports' },
  { href: '/dashboard/user-management', icon: Shield, label: 'Usuários', adminOnly: true, tourId: 'step-users' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações', tourId: 'step-settings' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre', tourId: 'step-about' },
];

export function DashboardNav({ isMobile = false, navItems = defaultNavItems }: { isMobile?: boolean, navItems?: any[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { data: session } = useSession();
 
  return (
     <SidebarMenu>
        {navItems.map(({ href, icon: Icon, label, tourId, adminOnly, isSeparator }, index) => {
            if (isSeparator) {
                return (
                    <div key={`sep-${index}`} className="px-3 py-2">
                        <Separator className="bg-primary-foreground/20" />
                        <span className="text-xs font-bold uppercase text-primary-foreground/50 mt-2 block">{label}</span>
                    </div>
                )
            }

            if (adminOnly && session?.user?.accessLevel !== 'Admin') {
                return null;
            }

            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

            return (
                <SidebarMenuItem key={label} data-tour-id={tourId}>
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
