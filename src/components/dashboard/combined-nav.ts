
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
  LayoutDashboard,
  Pill,
  Hospital
} from 'lucide-react';

export const combinedNavItems = [
  { href: '/dashboard', icon: Home, label: 'Visão Geral (Coord.)', tourId: 'step-dashboard' },
  { href: '/dashboard/select-location', icon: Building2, label: 'Trocar Ambiente' },
  { isSeparator: true, label: "CAF" },
  { href: '/dashboard/orders', icon: ShoppingCart, label: 'Pedidos (CAF)', tourId: 'step-orders' },
  { href: '/dashboard/patients', icon: Users, label: 'Pacientes (CAF)', tourId: 'step-patients' },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades', tourId: 'step-units' },
  { href: '/dashboard/reports', icon: BarChart2, label: 'Relatórios (CAF)', tourId: 'step-reports' },
  { isSeparator: true, label: "Hospital" },
  { href: '/dashboard/hospital', icon: LayoutDashboard, label: 'Dashboard (Hospital)' },
  { href: '/dashboard/hospital/dispense', icon: Pill, label: 'Dispensar (Setor)' },
  { href: '/dashboard/hospital/patients', icon: Hospital, label: 'Pacientes Internados' },
  { href: '/dashboard/hospital/reports', icon: BarChart2, label: 'Relatórios (Hospital)' },
  { isSeparator: true, label: "Geral" },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventário (Global)', tourId: 'step-inventory' },
  { href: '/dashboard/user-management', icon: Shield, label: 'Usuários', adminOnly: true, tourId: 'step-users' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configurações', tourId: 'step-settings' },
  { href: '/dashboard/about', icon: Info, label: 'Sobre', tourId: 'step-about' },
];
