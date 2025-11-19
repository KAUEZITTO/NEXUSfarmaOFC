
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Pill,
  Users,
  BarChart2,
  Settings,
  Info,
  Building,
  Printer,
  ClipboardCheck,
  Tags,
  Server,
  Hospital,
  History,
} from 'lucide-react';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

export const hospitalNavItems = [
  { href: '/dashboard/hospital', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/inventory?location=Hospital', icon: Package, label: 'Inventário' },
  { href: '/dashboard/hospital/orders', icon: ClipboardCheck, label: 'Pedidos ao CAF' },
  { href: '/dashboard/hospital/dispense', icon: Pill, label: 'Dispensar (Setor)' },
  { href: '/dashboard/hospital/patients', icon: Hospital, label: 'Pacientes Internados' },
  { href: '/dashboard/hospital/dispensations-log', icon: History, label: 'Registros (Setor)' },
  { href: '/dashboard/hospital/sectors', icon: Building, label: 'Gerenciar Setores' },
  { href: '/dashboard/hospital/reports', icon: BarChart2, label: 'Relatórios' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre' },
];

export function HospitalNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
 
  return (
     <SidebarMenu>
        {hospitalNavItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;

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
                      <Link href={href!}>
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
