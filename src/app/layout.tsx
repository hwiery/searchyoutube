import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'YouTube 검색 및 분석',
  description: '유튜브 채널과 동영상을 상세하게 검색하고 분석하세요.',
  icons: {
    icon: [
      { url: '/assets/favicon.ico' },
      { url: '/assets/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/favicon-96x96.png', sizes: '96x96', type: 'image/png' }
    ],
    apple: [
      { url: '/assets/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
      { url: '/assets/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
      { url: '/assets/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { url: '/assets/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
      { url: '/assets/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/assets/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/assets/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/assets/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/assets/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/assets/apple-icon-precomposed.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/apple-icon.png', sizes: '192x192', type: 'image/png' }
    ],
    other: [
      { rel: 'manifest', url: '/assets/manifest.json' },
      { rel: 'msapplication-config', url: '/assets/browserconfig.xml' },
      { rel: 'android-icon-36x36', url: '/assets/android-icon-36x36.png', sizes: '36x36', type: 'image/png' },
      { rel: 'android-icon-48x48', url: '/assets/android-icon-48x48.png', sizes: '48x48', type: 'image/png' },
      { rel: 'android-icon-72x72', url: '/assets/android-icon-72x72.png', sizes: '72x72', type: 'image/png' },
      { rel: 'android-icon-96x96', url: '/assets/android-icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { rel: 'android-icon-144x144', url: '/assets/android-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { rel: 'android-icon-192x192', url: '/assets/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'ms-icon-70x70', url: '/assets/ms-icon-70x70.png', sizes: '70x70', type: 'image/png' },
      { rel: 'ms-icon-144x144', url: '/assets/ms-icon-144x144.png', sizes: '144x144', type: 'image/png' },
      { rel: 'ms-icon-150x150', url: '/assets/ms-icon-150x150.png', sizes: '150x150', type: 'image/png' },
      { rel: 'ms-icon-310x310', url: '/assets/ms-icon-310x310.png', sizes: '310x310', type: 'image/png' }
    ]
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-b from-white to-pink-50">
          {children}
        </main>
      </body>
    </html>
  );
} 