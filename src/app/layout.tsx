
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/auth/auth-provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentBanner } from '@/components/cookie-consent-banner';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'NexusFarma',
  description: 'Sistema de Gestão de Estoque Farmacêutico',
  icons: {
    icon: '/NEXUSnv.png',
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
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <CookieConsentBanner />
        <SpeedInsights />
      </body>
    </html>
  );
}
