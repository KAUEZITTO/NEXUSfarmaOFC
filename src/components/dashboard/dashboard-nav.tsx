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

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos', badge: 6 },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre' },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
      {
        'bg-muted text-primary': pathname.startsWith(href) && href !== '/dashboard' || pathname === href,
        'justify-center text-lg': isMobile,
      }
    );

  return (
    <nav className={cn('grid items-start text-sm font-medium', isMobile ? 'gap-4 px-2' : 'gap-1 px-2 lg:px-4')}>
      {navItems.map(({ href, icon: Icon, label, badge }) => (
        <Link key={label} href={href} className={linkClass(href)}>
          <Icon className="h-4 w-4" />
          {label}
          {badge && (
            <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
              {badge}
            </Badge>
          )}
        </Link>
      ))}
    </nav>
  );
}
