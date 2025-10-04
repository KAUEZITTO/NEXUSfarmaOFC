
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/auth/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'NexusFarma',
  description: 'Sistema de Gestão de Estoque Farmacêutico',
  icons: {
    icon: `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3e%3cg transform='rotate(45 50 50)'%3e%3cpath d='M35,15 C20,15,20,35,35,35 L65,35 C80,35,80,15,65,15 Z' fill='%232563eb'/%3e%3cpath d='M65,85 C80,85,80,65,65,65 L35,65 C20,65,20,85,35,85 Z' fill='%2316a34a'/%3e%3crect x='20' y='35' width='60' height='30' fill='white'/%3e%3c/g%3e%3c/svg%3e`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-body antialiased', inter.variable)}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              })();
            `,
          }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
