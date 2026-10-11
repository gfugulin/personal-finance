import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MobileNav } from '@/components/mobile-nav';

export const metadata: Metadata = {
  title: 'Finanças Pessoais',
  description: 'Organizador pessoal financeiro, patrimonial e fiscal.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finanças',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#030712',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-slate-50 min-h-screen antialiased flex flex-col items-center">
        <main className="w-full max-w-md min-h-screen pb-20 px-4 pt-4 flex flex-col flex-1">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
