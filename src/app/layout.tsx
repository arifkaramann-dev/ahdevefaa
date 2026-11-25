import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';
import { PwaRegistration } from '@/components/pwa-registration';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Ahde Vefa — Dijital Dergâh', template: '%s | Ahde Vefa' },
  description: 'Yanlışlıktan değil, yalnızlıktan. Manevî yolculuğunuzu mahremiyetle sürdürdüğünüz, gönülden gönüle bir dijital dergâh.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/mark.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'Ahde Vefa', statusBarStyle: 'default' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#173d32' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body><Providers><PwaRegistration /><AppShell>{children}</AppShell></Providers></body></html>;
}
