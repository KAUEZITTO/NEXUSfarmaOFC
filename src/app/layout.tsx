
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/auth/auth-provider';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CookieConsentBanner } from '@/components/cookie-consent-banner';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: 'NexusFarma - Gestão Farmacêutica Inteligente',
  description: 'Sistema integrado para controle, rastreabilidade e eficiência na distribuição de medicamentos.',
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
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster />
          <CookieConsentBanner />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
