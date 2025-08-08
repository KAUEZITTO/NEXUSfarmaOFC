import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'NexusFarma',
  description: 'Sistema de Gestão de Estoque Farmacêutico',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-body antialiased', inter.variable)}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
