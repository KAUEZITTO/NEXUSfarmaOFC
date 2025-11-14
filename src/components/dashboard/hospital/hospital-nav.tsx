
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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


export const hospitalNavItems = [
  { href: '/dashboard/hospital', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/inventory?location=Hospital', icon: Package, label: 'Inventário' },
  { 
    label: 'Pedidos ao CAF',
    icon: ClipboardCheck,
    subItems: [
        { href: '/dashboard/hospital/orders', label: 'Fazer e Ver Pedidos' },
        { href: '/dashboard/hospital/orders/template', label: 'Definir Pedido Padrão' },
    ]
  },
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
        <Accordion type="multiple" className="w-full">
            {hospitalNavItems.map(({ href, icon: Icon, label, subItems }) => {
                if (subItems) {
                    const isSubActive = subItems.some(sub => pathname.startsWith(sub.href));
                    return (
                        <AccordionItem value={label} key={label} className="border-none">
                            <AccordionTrigger className="w-full justify-start rounded-md p-2 text-sm font-medium text-primary-foreground/80 hover:bg-secondary hover:text-secondary-foreground hover:no-underline data-[state=open]:bg-secondary/80">
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5" />
                                    <span>{label}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pl-8 pt-2">
                                <SidebarMenu>
                                    {subItems.map(sub => (
                                        <SidebarMenuItem key={sub.href}>
                                            <Link href={sub.href} className={`w-full text-primary-foreground/70 hover:text-primary-foreground text-sm rounded-md p-2 flex ${pathname === sub.href ? 'bg-secondary/50 font-semibold text-primary-foreground' : ''}`}>
                                                {sub.label}
                                            </Link>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </AccordionContent>
                        </AccordionItem>
                    )
                }

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
        </Accordion>
    </SidebarMenu>
  );
}
